import type { AmqpConnectionManager, ChannelWrapper } from "amqp-connection-manager";
declare module "fastify" {
    interface FastifyInstance {
        amqp: AmqpConnectionManager;
        publisher: ChannelWrapper;
    }
}
/** Resilient AMQP connection plus a confirm-channel publisher, shared app wide. */
declare const _default: (app: import("fastify").FastifyInstance<import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>) => Promise<void>;
export default _default;
