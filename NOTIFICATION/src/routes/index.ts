import { Router } from 'express';
import healthRoutes from './health.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use(healthRoutes);
router.use(userRoutes);
router.use(adminRoutes);

export default router;
