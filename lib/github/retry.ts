/**
 * GitNode — Resilience & Exponential Backoff Retry Utility
 */

import type { AppError } from '@/types/error';

/**
 * Retry an asynchronous function with exponential backoff and rate-limit parsing.
 * @param fn - The async function to execute
 * @param maxRetries - Maximum number of retries (default: 3)
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      const err = error as { status?: number; response?: { headers?: Record<string, string> } };

      // If rate limited, wait until reset
      if (err.status === 403 && err.response?.headers?.['x-ratelimit-remaining'] === '0') {
        const resetTime = parseInt(err.response.headers['x-ratelimit-reset'] || '0', 10);
        const waitMs = Math.max(0, resetTime * 1000 - Date.now()) + 1000;
        const rateLimitError: AppError = {
          type: 'rate_limit',
          message: 'GitHub API rate limit exceeded',
          retryAfter: Math.ceil(waitMs / 1000),
        };
        throw rateLimitError;
      }

      // Do not retry 404 Not Found or 401 Unauthorized
      if (err.status === 404 || err.status === 401) {
        throw error;
      }

      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
