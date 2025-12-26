import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "@/config";
import logger from "@/utils/logger";
import { errorHandler } from "@/middleware/errorHandler.middleware";
import { startAllJobs } from "@/jobs";

// Import routes
import healthRoutes from "@/routes/health.routes";
import userRoutes from "@/routes/user.routes";
import adminRoutes from "@/routes/admin.routes";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", healthRoutes);
app.use("/api", userRoutes);
app.use("/api/admin", adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start cron jobs
startAllJobs();

// Start server
app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
});
