/** Liveness and readiness probes. Kept schema-light and public. */
export async function healthRoutes(app) {
    app.get("/healthz", { schema: { tags: ["health"] } }, async () => ({
        status: "ok",
    }));
    app.get("/readyz", { schema: { tags: ["health"] } }, async (_req, reply) => {
        const checks = {};
        try {
            await app.prisma.$queryRaw `SELECT 1`;
            checks.postgres = "ok";
        }
        catch {
            checks.postgres = "fail";
        }
        try {
            await app.redis.ping();
            checks.redis = "ok";
        }
        catch {
            checks.redis = "fail";
        }
        const healthy = Object.values(checks).every((v) => v === "ok");
        return reply.code(healthy ? 200 : 503).send({ status: healthy ? "ready" : "degraded", checks });
    });
}
//# sourceMappingURL=health.routes.js.map