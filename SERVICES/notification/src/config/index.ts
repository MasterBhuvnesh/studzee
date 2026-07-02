function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing required env var: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? fallback : n;
}

export const config = {
  env: optional("NODE_ENV", "development"),
  isProd: process.env.NODE_ENV === "production",
  port: intEnv("PORT", 3000),
  logLevel: optional("LOG_LEVEL", "info"),

  databaseUrl: required("DATABASE_URL"),
  rabbitmqUrl: required("RABBITMQ_URL"),

  clerk: {
    secretKey: required("CLERK_SECRET_KEY"),
    publishableKey: required("CLERK_PUBLISHABLE_KEY"),
    webhookSecret: optional("CLERK_WEBHOOK_SECRET", ""),
  },

  smtp: {
    host: optional("SMTP_HOST", ""),
    port: intEnv("SMTP_PORT", 587),
    user: optional("SMTP_USER", ""),
    password: optional("SMTP_PASSWORD", ""),
    from: optional("EMAIL_FROM", "Studzee <no-reply@studzee.in>"),
  },
} as const;

export type Config = typeof config;
