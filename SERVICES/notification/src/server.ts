import { buildApp } from "./app.js";
import { config } from "./config/index.js";

async function main(): Promise<void> {
  const app = await buildApp();

  // P7 wires startConsumer(app) here to consume article.published events.

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, "shutting down");
    await app.close();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error("failed to start notification service", err);
  process.exit(1);
});
