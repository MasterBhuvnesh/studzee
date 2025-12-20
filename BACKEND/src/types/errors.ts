/**
 * Error-related type definitions
 */

export interface AppError extends Error {
  statusCode?: number
}
