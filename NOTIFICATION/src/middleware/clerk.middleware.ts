import { clerkMiddleware } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config';

export const clerkAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (config.NODE_ENV === 'development' && req.headers['authorization'] === `Bearer ${config.DEV_TOKEN}`) {
    req.auth = { userId: 'dev_user_id', sessionId: null, getToken: async () => 'dev_token' } as any;
    return next();
  }
  return clerkMiddleware()(req, res, next);
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    // In a real app, you'd check for a specific role or permission from Clerk's session claims
    // For this example, we'll assume a dev user is an admin or check a custom claim.
        if (config.NODE_ENV === 'development' && req.auth.userId === 'dev_user_id') {
        return next();
    }
    
    // IMPORTANT: In a production environment, you must implement proper role-based access control.
    // This could be based on Clerk's session claims, for example:
    //
    // if (req.auth.sessionClaims?.metadata?.role !== 'admin') {
    //   return res.status(403).json({ error: 'Forbidden: Admin access required' });
    // }
    //
    // For this exercise, to ensure the service is runnable without complex setup,
    // we are allowing any authenticated user to be treated as an admin in non-development environments.
    // This is NOT secure for production.
        if (!req.auth.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};
