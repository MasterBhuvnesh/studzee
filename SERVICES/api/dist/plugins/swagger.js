import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
/** OpenAPI spec built from route JSON Schemas, served at /docs. */
export default fp(async (app) => {
    await app.register(swagger, {
        openapi: {
            info: {
                title: "Studzee API",
                description: "Studzee content, chat, generation and billing API",
                version: "1.0.0",
            },
            components: {
                securitySchemes: {
                    clerkJwt: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
        },
    });
    await app.register(swaggerUi, {
        routePrefix: "/docs",
        uiConfig: { docExpansion: "list", deepLinking: true },
    });
});
//# sourceMappingURL=swagger.js.map