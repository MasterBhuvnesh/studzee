import fp from "fastify-plugin";
import type { AmqpConnectionManager, ChannelWrapper } from "amqp-connection-manager";
import { connectAmqp, createPublisher } from "@studzee/shared";
import { config } from "../config/index.js";

declare module "fastify" {
  interface FastifyInstance {
    amqp: AmqpConnectionManager;
    publisher: ChannelWrapper;
  }
}

/** Resilient AMQP connection plus a confirm-channel publisher, shared app wide. */
export default fp(async (app) => {
  const amqp = connectAmqp(config.rabbitmqUrl, app.log);
  const publisher = createPublisher(amqp);

  app.decorate("amqp", amqp);
  app.decorate("publisher", publisher);

  app.addHook("onClose", async () => {
    await publisher.close();
    await amqp.close();
  });
});
