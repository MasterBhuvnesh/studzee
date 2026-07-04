function required(name) {
    const value = process.env[name];
    if (!value)
        throw new Error(`missing required env var: ${name}`);
    return value;
}
function optional(name, fallback) {
    return process.env[name] ?? fallback;
}
function intEnv(name, fallback) {
    const raw = process.env[name];
    if (!raw)
        return fallback;
    const n = Number.parseInt(raw, 10);
    return Number.isNaN(n) ? fallback : n;
}
export const config = {
    env: optional("NODE_ENV", "development"),
    isProd: process.env.NODE_ENV === "production",
    port: intEnv("PORT", 3000),
    logLevel: optional("LOG_LEVEL", "info"),
    databaseUrl: required("DATABASE_URL"),
    redisUrl: required("REDIS_URL"),
    rabbitmqUrl: required("RABBITMQ_URL"),
    clerk: {
        secretKey: required("CLERK_SECRET_KEY"),
        publishableKey: required("CLERK_PUBLISHABLE_KEY"),
    },
    llm: {
        baseUrl: optional("LLM_BASE_URL", "https://api.groq.com/openai/v1"),
        apiKey: optional("LLM_API_KEY", ""),
        model: optional("LLM_MODEL", "llama-3.3-70b-versatile"),
    },
    s3: {
        region: optional("AWS_REGION", "ap-south-1"),
        accessKeyId: optional("AWS_ACCESS_KEY_ID", ""),
        secretAccessKey: optional("AWS_SECRET_ACCESS_KEY", ""),
        bucket: optional("AWS_S3_BUCKET", ""),
    },
    revenuecatWebhookSecret: optional("RC_WEBHOOK_SECRET", ""),
    cache: {
        listTtl: intEnv("LIST_CACHE_TTL", 60),
        docTtl: intEnv("DOC_CACHE_TTL", 300),
    },
};
//# sourceMappingURL=index.js.map