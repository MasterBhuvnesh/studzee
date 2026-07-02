import { connectAmqp, createLogger } from "@studzee/shared";
import { config } from "./config/index.js";

/**
 * AI generation worker entry point. Same image as the api, run with
 * `node dist/worker.js`. P1 scaffold only establishes the AMQP connection so
 * the K8s Deployment is healthy; the generate consumer is wired in P6.
 */
async function main(): Promise<void> {
  const log = createLogger("worker");
  const amqp = connectAmqp(config.rabbitmqUrl, log);

  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, "worker shutting down");
    await amqp.close();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  log.info("worker started, awaiting consumer wiring (P6)");
}

main().catch((err) => {
  console.error("failed to start worker", err);
  process.exit(1);
});
