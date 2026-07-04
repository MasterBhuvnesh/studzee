import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from "fastify";
export interface ClerkConfig {
    secretKey: string;
    publishableKey: string;
}
/** Register Clerk request verification. Call once during app build. */
export declare function registerClerk(app: FastifyInstance, config: ClerkConfig): Promise<void>;
/** Return the Clerk user id or null. Thin wrapper so callers do not import @clerk directly. */
export declare function authUserId(request: FastifyRequest): string | null;
/** 401 unless a valid Clerk session is present. */
export declare const requireUser: preHandlerHookHandler;
/** 401 without a session, 403 without publicMetadata.role === "admin". Result cached 60s. */
export declare const requireAdmin: preHandlerHookHandler;
