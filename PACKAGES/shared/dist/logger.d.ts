import { type Logger, type LoggerOptions } from "pino";
/**
 * Pino config shared by every service. JSON to stdout so Promtail ships it to Loki.
 * In development we pretty-print when pino-pretty is available.
 */
export declare function loggerOptions(service: string): LoggerOptions;
export declare function createLogger(service: string): Logger;
