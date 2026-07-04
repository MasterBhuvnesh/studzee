import { buildApp } from "./app.js";
import { config } from "./config/index.js";
async function main() {
    const app = await buildApp();
    const shutdown = async (signal) => {
        app.log.info({ signal }, "shutting down");
        await app.close();
        process.exit(0);
    };
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
    await app.listen({ port: config.port, host: "0.0.0.0" });
}
main().catch((err) => {
    console.error("failed to start api", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map