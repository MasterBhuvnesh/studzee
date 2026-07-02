import { clerkPlugin, getAuth, clerkClient } from "@clerk/fastify";
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
} from "fastify";

export interface ClerkConfig {
  secretKey: string;
  publishableKey: string;
}

/** Register Clerk request verification. Call once during app build. */
export async function registerClerk(
  app: FastifyInstance,
  config: ClerkConfig,
): Promise<void> {
  await app.register(clerkPlugin, {
    secretKey: config.secretKey,
    publishableKey: config.publishableKey,
  });
}

/** Return the Clerk user id or null. Thin wrapper so callers do not import @clerk directly. */
export function authUserId(request: FastifyRequest): string | null {
  return getAuth(request).userId ?? null;
}

/** 401 unless a valid Clerk session is present. */
export const requireUser: preHandlerHookHandler = async (request, reply) => {
  if (!authUserId(request)) {
    await reply.code(401).send({ error: { message: "authentication required" } });
  }
};

const ADMIN_TTL_MS = 60_000;
const adminCache = new Map<string, { isAdmin: boolean; expires: number }>();

async function isAdmin(userId: string): Promise<boolean> {
  const cached = adminCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.isAdmin;

  const user = await clerkClient.users.getUser(userId);
  const isAdmin = user.publicMetadata?.role === "admin";
  adminCache.set(userId, { isAdmin, expires: Date.now() + ADMIN_TTL_MS });
  return isAdmin;
}

/** 401 without a session, 403 without publicMetadata.role === "admin". Result cached 60s. */
export const requireAdmin: preHandlerHookHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = authUserId(request);
  if (!userId) {
    await reply.code(401).send({ error: { message: "authentication required" } });
    return;
  }
  if (!(await isAdmin(userId))) {
    await reply.code(403).send({ error: { message: "admin role required" } });
  }
};
