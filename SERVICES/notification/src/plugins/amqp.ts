import fp from "fastify-plugin";
import type { AmqpConnectionManager } from "amqp-connection-manager";
import { connectAmqp } from "@studzee/shared";
import { config } from "../config/index.js";

declare module "fastify" {
  interface FastifyInstance {
    amqp: AmqpConnectionManager;
  }
}

/** Resilient AMQP connection. The article.published consumer is wired in P7. */
export default fp(async (app) => {
  const amqp = connectAmqp(config.rabbitmqUrl, app.log);
  app.decorate("amqp", amqp);
  app.addHook("onClose", async () => {
    await amqp.close();
  });
});
