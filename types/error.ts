/**
 * GitNode — Error Handling Domain Types
 */

export type AppErrorType =
  | 'not_found'
  | 'rate_limit'
  | 'private_repo'
  | 'parse_error'
  | 'network'
  | 'unknown';

/** Structured application error interface */
export interface AppError {
  type: AppErrorType;
  message: string;
  retryAfter?: number; // seconds until rate limit resets
}
