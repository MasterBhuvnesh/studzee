export declare const config: {
    readonly env: string;
    readonly isProd: boolean;
    readonly port: number;
    readonly logLevel: string;
    readonly databaseUrl: string;
    readonly rabbitmqUrl: string;
    readonly clerk: {
        readonly secretKey: string;
        readonly publishableKey: string;
        readonly webhookSecret: string;
    };
    readonly smtp: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly password: string;
        readonly from: string;
    };
};
export type Config = typeof config;
