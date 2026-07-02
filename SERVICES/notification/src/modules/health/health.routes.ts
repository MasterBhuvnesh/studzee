import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/healthz", async () => ({ status: "ok" }));

  app.get("/readyz", async (_req, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return { status: "ready", checks: { postgres: "ok" } };
    } catch {
      return reply.code(503).send({ status: "degraded", checks: { postgres: "fail" } });
    }
  });
}
