import { Token, CreateTokenRequest } from '@/models/token.model';

/**
 * Token repository interface for database operations
 */
export interface ITokenRepository {
  /**
   * Store a new token in the database
   * @param tokenData - The token data to store
   * @returns Promise resolving to the stored token
   * @throws DatabaseError when storage fails
   */
  createToken(tokenData: CreateTokenRequest): Promise<Token>;

  /**
   * Retrieve all tokens from the database
   * @returns Promise resolving to array of tokens
   * @throws DatabaseError when retrieval fails
   */
  getAllTokens(): Promise<string[]>;

  /**
   * Check if a token exists in the database
   * @param token - The token to check
   * @returns Promise resolving to boolean indicating existence
   * @throws DatabaseError when check fails
   */
  tokenExists(token: string): Promise<boolean>;
}
