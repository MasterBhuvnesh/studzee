import { PrismaClient } from "@prisma/client";
declare module "fastify" {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}
/** Single Prisma client, connected at boot, disconnected on shutdown. */
declare const _default: (app: import("fastify").FastifyInstance<import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>) => Promise<void>;
export default _default;
