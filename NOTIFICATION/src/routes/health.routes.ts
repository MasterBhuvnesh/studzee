import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route   GET /healthcheck
 * @desc    Basic health check endpoint
 * @access  Public (no auth)
 */
router.get('/healthcheck', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'notification-service',
  });
});

export default router;
