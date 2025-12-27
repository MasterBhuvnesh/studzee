import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { config } from '@/config';
import { startAllJobs } from '@/jobs';
import { errorHandler } from '@/middleware/errorHandler.middleware';
// Import routes
import adminRoutes from '@/routes/admin.routes';
import healthRoutes from '@/routes/health.routes';
import userRoutes from '@/routes/user.routes';
import logger from '@/utils/logger';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', healthRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start cron jobs
startAllJobs();

// Start server
app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});
