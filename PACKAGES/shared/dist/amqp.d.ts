import { type AmqpConnectionManager, type ChannelWrapper } from "amqp-connection-manager";
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
export declare const EXCHANGE = "studzee.events";
/** Dead letter exchange, everything rejected lands here. */
export declare const DLX = "studzee.dlx";
/** Single parking lot queue for dead lettered messages. */
export declare const DLQ = "studzee.dlq";
export declare const QUEUE_AI_GENERATE = "ai.generate";
export declare const QUEUE_NOTIFICATION_EVENTS = "notification.events";
export declare const RK_AI_GENERATE_REQUEST = "ai.generate.request";
export declare const RK_ARTICLE_PUBLISHED = "article.published";
/** Assert the full topology. Idempotent, safe for every service to call on connect. */
export declare function assertTopology(channel: ConfirmChannel): Promise<void>;
export declare function connectAmqp(url: string, log: LogLike): AmqpConnectionManager;
/**
 * Publisher channel. Buffers publishes while disconnected and asserts topology
 * on (re)connect, so a broker blip never drops an event or crashes a request.
 */
export declare function createPublisher(conn: AmqpConnectionManager): ChannelWrapper;
export interface ConsumerOptions {
    queue: string;
    prefetch: number;
    /** Return normally to ack. Throw to nack (requeue false) which routes to the DLQ. */
    onMessage: (payload: unknown, raw: ConsumeMessage) => Promise<void>;
    log: LogLike;
}
export declare function createConsumer(conn: AmqpConnectionManager, opts: ConsumerOptions): ChannelWrapper;
