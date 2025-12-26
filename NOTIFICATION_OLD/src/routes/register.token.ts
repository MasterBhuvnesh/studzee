import { NextFunction, Request, Response, Router } from 'express';
import Joi from 'joi';

import { authenticate } from '@/middleware/auth';
import { tokenRegisterRateLimit } from '@/middleware/rate-limit';
import { TokenService } from '@/services/token.service';
import { ValidationError } from '@/utils/errors/custom-errors';
import { asyncHandler } from '@/utils/errors/error-handler';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/utils/responses/api-response';
import { registerTokenSchema } from '@/validators/register.token.validator';

const router = Router();
const tokenService = new TokenService();

const validate =
  (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }
    next();
  };

/**
 * @route   POST /register-token
 * @desc    Register an Expo push token
 * @access  Private (requires authentication)
 * @param   {string} token - The Expo push token to register
 * @returns {ApiResponseFormat} Success response with registration confirmation
 * @throws  {ValidationError} When token format is invalid
 * @throws  {DatabaseError} When database operation fails
 */
router.post(
  '/register-token',
  tokenRegisterRateLimit,
  authenticate,
  validate(registerTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    logger.log(`Attempting to register token: ${token}`);

    const registeredToken = await tokenService.registerToken({ token });

    const response = ApiResponse.success(
      { token: registeredToken.token },
      'Token stored successfully',
      201,
    );

    res.status(201).json(response);
  }),
);

export default router;
