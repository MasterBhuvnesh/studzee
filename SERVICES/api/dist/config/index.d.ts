export declare const config: {
    readonly env: string;
    readonly isProd: boolean;
    readonly port: number;
    readonly logLevel: string;
    readonly databaseUrl: string;
    readonly redisUrl: string;
    readonly rabbitmqUrl: string;
    readonly clerk: {
        readonly secretKey: string;
        readonly publishableKey: string;
    };
    readonly llm: {
        readonly baseUrl: string;
        readonly apiKey: string;
        readonly model: string;
    };
    readonly s3: {
        readonly region: string;
        readonly accessKeyId: string;
        readonly secretAccessKey: string;
        readonly bucket: string;
    };
    readonly revenuecatWebhookSecret: string;
    readonly cache: {
        readonly listTtl: number;
        readonly docTtl: number;
    };
};
export type Config = typeof config;
