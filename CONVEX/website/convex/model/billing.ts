import { ActionCtx, MutationCtx, QueryCtx } from '../_generated/server';

type AnyCtx = ActionCtx | QueryCtx | MutationCtx;

/**
 * Clerk Billing adds `fea` (features) + `pla` (plan) claims to the session token
 * once Billing is enabled and the claims are added to the Convex JWT template.
 * Returns null when the claim is absent (billing not wired yet).
 */
export async function getFeatures(ctx: AnyCtx): Promise<string[] | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const fea = (identity as Record<string, unknown>).fea;
  if (Array.isArray(fea)) return fea.map(String);
  if (typeof fea === 'string') return fea.split(',').map((s) => s.trim());
  return null;
}

export async function requireFeature(
  ctx: AnyCtx,
  feature: string
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');

  const features = await getFeatures(ctx);
  // ponytail: fail-open until Clerk Billing claims exist on the JWT template,
  // so AI works during dev. Once `fea` is present, membership is enforced.
  if (features === null) return;
  if (!features.includes(feature)) {
    throw new Error(`This feature requires an upgraded plan: ${feature}`);
  }
}
