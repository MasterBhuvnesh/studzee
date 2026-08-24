/**
 * Error-related type definitions
 */

export interface AppError extends Error {
  statusCode?: number
  /**
   * Machine readable reason, for clients that branch on the failure kind, for
   * example CONTENT_LOCKED on a points gated document.
   */
  code?: string
}
