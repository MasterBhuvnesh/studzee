import { pino, type Logger, type LoggerOptions } from "pino";

/**
 * Pino config shared by every service. JSON to stdout so Promtail ships it to Loki.
 * In development we pretty-print when pino-pretty is available.
 */
export function loggerOptions(service: string): LoggerOptions {
  const level = process.env.LOG_LEVEL ?? "info";
  return {
    level,
    base: { service },
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie"],
      remove: true,
    },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };
}

export function createLogger(service: string): Logger {
  return pino(loggerOptions(service));
}
