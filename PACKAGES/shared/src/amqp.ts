import amqp, {
  type AmqpConnectionManager,
  type ChannelWrapper,
} from "amqp-connection-manager";
import type { ConfirmChannel, ConsumeMessage } from "amqplib";

/**
 * Minimal logger shape satisfied by both pino and Fastify's request logger,
 * so callers can pass either without a type clash.
 */
export interface LogLike {
  info(obj: unknown, msg?: string): void;
  info(msg: string): void;
  warn(obj: unknown, msg?: string): void;
  warn(msg: string): void;
  error(obj: unknown, msg?: string): void;
  error(msg: string): void;
}

/** Topic exchange every event flows through. */
export const EXCHANGE = "studzee.events";
/** Dead letter exchange, everything rejected lands here. */
export const DLX = "studzee.dlx";
/** Single parking lot queue for dead lettered messages. */
export const DLQ = "studzee.dlq";

export const QUEUE_AI_GENERATE = "ai.generate";
export const QUEUE_NOTIFICATION_EVENTS = "notification.events";

export const RK_AI_GENERATE_REQUEST = "ai.generate.request";
export const RK_ARTICLE_PUBLISHED = "article.published";

/** Assert the full topology. Idempotent, safe for every service to call on connect. */
export async function assertTopology(channel: ConfirmChannel): Promise<void> {
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  await channel.assertExchange(DLX, "topic", { durable: true });

  await channel.assertQueue(DLQ, { durable: true });
  await channel.bindQueue(DLQ, DLX, "#");

  await channel.assertQueue(QUEUE_AI_GENERATE, {
    durable: true,
    deadLetterExchange: DLX,
  });
  await channel.bindQueue(QUEUE_AI_GENERATE, EXCHANGE, RK_AI_GENERATE_REQUEST);

  await channel.assertQueue(QUEUE_NOTIFICATION_EVENTS, {
    durable: true,
    deadLetterExchange: DLX,
  });
  await channel.bindQueue(
    QUEUE_NOTIFICATION_EVENTS,
    EXCHANGE,
    RK_ARTICLE_PUBLISHED,
  );
  // Future notify.* events land on the same queue without a code change.
  await channel.bindQueue(QUEUE_NOTIFICATION_EVENTS, EXCHANGE, "notify.#");
}

export function connectAmqp(url: string, log: LogLike): AmqpConnectionManager {
  const conn = amqp.connect([url], { heartbeatIntervalInSeconds: 15 });
  conn.on("connect", () => log.info("amqp connected"));
  conn.on("disconnect", ({ err }) => log.warn({ err: err?.message }, "amqp disconnected"));
  return conn;
}

/**
 * Publisher channel. Buffers publishes while disconnected and asserts topology
 * on (re)connect, so a broker blip never drops an event or crashes a request.
 */
export function createPublisher(conn: AmqpConnectionManager): ChannelWrapper {
  return conn.createChannel({
    json: true,
    setup: (channel: ConfirmChannel) => assertTopology(channel),
  });
}

export interface ConsumerOptions {
  queue: string;
  prefetch: number;
  /** Return normally to ack. Throw to nack (requeue false) which routes to the DLQ. */
  onMessage: (payload: unknown, raw: ConsumeMessage) => Promise<void>;
  log: LogLike;
}

export function createConsumer(
  conn: AmqpConnectionManager,
  opts: ConsumerOptions,
): ChannelWrapper {
  return conn.createChannel({
    setup: async (channel: ConfirmChannel) => {
      await assertTopology(channel);
      await channel.prefetch(opts.prefetch);
      await channel.consume(opts.queue, (msg) => {
        if (!msg) return;
        void handle(channel, msg, opts);
      });
    },
  });
}

async function handle(
  channel: ConfirmChannel,
  msg: ConsumeMessage,
  opts: ConsumerOptions,
): Promise<void> {
  let payload: unknown;
  try {
    payload = JSON.parse(msg.content.toString());
  } catch {
    opts.log.error("amqp message was not json, dropping to dlq");
    channel.nack(msg, false, false);
    return;
  }
  try {
    await opts.onMessage(payload, msg);
    channel.ack(msg);
  } catch (err) {
    opts.log.error(
      { err: err instanceof Error ? err.message : err, queue: opts.queue },
      "consumer handler failed, dead lettering",
    );
    channel.nack(msg, false, false);
  }
}
