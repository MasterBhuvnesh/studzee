import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import fastifyRedis from "@fastify/redis";
import { loggerOptions, registerClerk } from "@studzee/shared";
import { config } from "./config/index.js";
import prismaPlugin from "./plugins/prisma.js";
import amqpPlugin from "./plugins/amqp.js";
import swaggerPlugin from "./plugins/swagger.js";
import { healthRoutes } from "./modules/health/health.routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: loggerOptions("api"),
    trustProxy: true,
    disableRequestLogging: false,
  });

  // Central error handler: log server errors, return a consistent envelope.
  app.setErrorHandler((err: FastifyError, request, reply) => {
    const status = err.statusCode ?? 500;
    if (status >= 500) request.log.error({ err }, "request failed");
    else request.log.warn({ err: err.message }, "request rejected");
    reply.code(status).send({
      error: { message: status >= 500 ? "internal server error" : err.message },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ error: { message: `route ${request.method} ${request.url} not found` } });
  });

  // Infrastructure plugins.
  await app.register(fastifyRedis, { url: config.redisUrl, closeClient: true });
  await app.register(prismaPlugin);
  await app.register(amqpPlugin);
  await app.register(swaggerPlugin);
  await registerClerk(app, config.clerk);

  // Feature modules. Additional modules register under /v1 in later phases.
  await app.register(healthRoutes);

  return app;
}
