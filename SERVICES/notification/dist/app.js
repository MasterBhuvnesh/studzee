import Fastify from "fastify";
import { loggerOptions, registerClerk } from "@studzee/shared";
import { config } from "./config/index.js";
import prismaPlugin from "./plugins/prisma.js";
import amqpPlugin from "./plugins/amqp.js";
import { healthRoutes } from "./modules/health/health.routes.js";
export async function buildApp() {
    const app = Fastify({
        logger: loggerOptions("notification"),
        trustProxy: true,
    });
    app.setErrorHandler((err, request, reply) => {
        const status = err.statusCode ?? 500;
        if (status >= 500)
            request.log.error({ err }, "request failed");
        else
            request.log.warn({ err: err.message }, "request rejected");
        reply.code(status).send({
            error: { message: status >= 500 ? "internal server error" : err.message },
        });
    });
    app.setNotFoundHandler((request, reply) => {
        reply.code(404).send({ error: { message: `route ${request.method} ${request.url} not found` } });
    });
    await app.register(prismaPlugin);
    await app.register(amqpPlugin);
    await registerClerk(app, config.clerk);
    await app.register(healthRoutes);
    return app;
}
//# sourceMappingURL=app.js.map