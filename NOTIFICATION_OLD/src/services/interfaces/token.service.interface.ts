import { Token, CreateTokenRequest } from '@/models/token.model';

/**
 * Token service interface for business logic operations
 */
export interface ITokenService {
  /**
   * Register a new token
   * @param tokenData - The token data to register
   * @returns Promise resolving to the registered token
   * @throws ValidationError for invalid token data
   * @throws ConflictError if token already exists
   * @throws DatabaseError for database operation failures
   */
  registerToken(tokenData: CreateTokenRequest): Promise<Token>;

  /**
   * Get all registered tokens
   * @returns Promise resolving to array of token strings
   * @throws DatabaseError for database operation failures
   */
  getAllTokens(): Promise<string[]>;

  /**
   * Validate token data
   * @param tokenData - The token data to validate
   * @throws ValidationError for invalid data
   */
  validateTokenData(tokenData: CreateTokenRequest): void;
}
