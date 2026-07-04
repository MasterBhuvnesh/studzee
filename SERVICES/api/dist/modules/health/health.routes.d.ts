import type { FastifyInstance } from "fastify";
/** Liveness and readiness probes. Kept schema-light and public. */
export declare function healthRoutes(app: FastifyInstance): Promise<void>;
