import { Router } from 'express';

import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';
import userRoutes from './user.routes';

const router = Router();

router.use(healthRoutes);
router.use(userRoutes);
router.use(adminRoutes);

export default router;
