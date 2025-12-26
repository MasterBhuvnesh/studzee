/**
 * Standardized API response format
 */

export interface ApiResponseFormat<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
}

export class ApiResponse {
  /**
   * Create a successful response
   */
  static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
  ): ApiResponseFormat<T> {
    return {
      success: true,
      message,
      data,
      statusCode,
    };
  }

  /**
   * Create an error response
   */
  static error(message: string, statusCode: number = 500): ApiResponseFormat {
    return {
      success: false,
      message,
      error: message,
      statusCode,
    };
  }

  /**
   * Create a validation error response
   */
  static validationError(message: string): ApiResponseFormat {
    return {
      success: false,
      message,
      error: message,
      statusCode: 400,
    };
  }
}
