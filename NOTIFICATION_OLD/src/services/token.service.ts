import { Token, CreateTokenRequest } from '@/models/token.model';
import { ITokenRepository } from '@/repositories/interfaces/token.repository.interface';
import { TokenRepository } from '@/repositories/token.repository';
import { ValidationError, ConflictError } from '@/utils/errors/custom-errors';
import { logger } from '@/utils/logger';

import { ITokenService } from './interfaces/token.service.interface';

/**
 * Token service implementation for business logic
 */
export class TokenService implements ITokenService {
  constructor(
    private readonly tokenRepository: ITokenRepository = new TokenRepository(),
  ) {}

  /**
   * Register a new token
   * @param tokenData - The token data to register
   * @returns Promise resolving to the registered token
   * @throws ValidationError for invalid token data
   * @throws ConflictError if token already exists
   * @throws DatabaseError for database operation failures
   */
  async registerToken(tokenData: CreateTokenRequest): Promise<Token> {
    // Validate input data
    this.validateTokenData(tokenData);

    // Check if token already exists
    const exists = await this.tokenRepository.tokenExists(tokenData.token);
    if (exists) {
      logger.log(`Token already exists: ${tokenData.token}`);
      // Return existing token info instead of throwing error for better UX
      return {
        token: tokenData.token,
        createdAt: new Date(),
      };
    }

    // Create new token
    const token = await this.tokenRepository.createToken(tokenData);
    logger.log(`Successfully registered new token: ${tokenData.token}`);

    return token;
  }

  /**
   * Get all registered tokens
   * @returns Promise resolving to array of token strings
   * @throws DatabaseError for database operation failures
   */
  async getAllTokens(): Promise<string[]> {
    const tokens = await this.tokenRepository.getAllTokens();
    logger.log(`Retrieved ${tokens.length} tokens from service`);
    return tokens;
  }

  /**
   * Validate token data
   * @param tokenData - The token data to validate
   * @throws ValidationError for invalid data
   */
  validateTokenData(tokenData: CreateTokenRequest): void {
    if (!tokenData) {
      throw new ValidationError('Token data is required');
    }

    if (!tokenData.token) {
      throw new ValidationError('Token is required');
    }

    if (typeof tokenData.token !== 'string') {
      throw new ValidationError('Token must be a string');
    }

    if (tokenData.token.trim().length === 0) {
      throw new ValidationError('Token cannot be empty');
    }

    // Basic Expo token format validation
    if (!this.isValidExpoToken(tokenData.token)) {
      throw new ValidationError('Invalid Expo token format');
    }
  }

  /**
   * Basic validation for Expo token format
   * @param token - The token to validate
   * @returns boolean indicating if token format is valid
   */
  private isValidExpoToken(token: string): boolean {
    // Expo tokens typically start with 'ExponentPushToken[' or 'ExpoPushToken['
    // and contain alphanumeric characters and hyphens
    const expoTokenPattern = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/;
    return expoTokenPattern.test(token);
  }
}
