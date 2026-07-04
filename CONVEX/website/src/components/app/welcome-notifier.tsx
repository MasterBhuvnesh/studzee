'use client';

import { useEffect } from 'react';
import { useConvexAuth, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';

/** Fires a one-time welcome notification for brand-new authenticated users. */
export function WelcomeNotifier() {
  const { isAuthenticated } = useConvexAuth();
  const ensureWelcome = useMutation(api.notifications.ensureWelcome);

  useEffect(() => {
    if (isAuthenticated) ensureWelcome().catch(() => {});
  }, [isAuthenticated, ensureWelcome]);

  return null;
}
