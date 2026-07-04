import type { AmqpConnectionManager } from "amqp-connection-manager";
declare module "fastify" {
    interface FastifyInstance {
        amqp: AmqpConnectionManager;
    }
}
/** Resilient AMQP connection. The article.published consumer is wired in P7. */
declare const _default: (app: import("fastify").FastifyInstance<import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>) => Promise<void>;
export default _default;
