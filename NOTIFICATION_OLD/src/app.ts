import express from 'express';

import getTokensRoute from '@/routes/get.tokens';
import healthcheckRoute from '@/routes/healthcheck';
import registerTokenRoute from '@/routes/register.token';
import sendPushRoute from '@/routes/send.notification';
import { errorHandler } from '@/utils/errors/error-handler';
// import { authenticate } from "@/middleware/auth";

// Initialize express app
const app = express();

// Middleware
app.use(express.json());

// 🔒 Apply auth globally — all routes below this will require Bearer token
// app.use(authenticate);

// Routes
app.use('/', healthcheckRoute);

//  We have direclty impelemented authentication middleware in the routes
app.use('/', sendPushRoute);
app.use('/', registerTokenRoute);
app.use('/', getTokensRoute);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler - must be last middleware
app.use(errorHandler);

export default app;
