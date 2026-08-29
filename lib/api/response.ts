/**
 * GitNode — Standardized API Response & Error Handlers
 */

import { NextResponse } from 'next/server';
import type { AppError } from '@/types/error';

export const DEFAULT_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

/**
 * Return a successful JSON response with default caching headers.
 */
export function apiSuccess<T>(data: T, headers?: Record<string, string>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...DEFAULT_CACHE_HEADERS,
      ...headers,
    },
  });
}

/**
 * Return a typed error JSON response.
 */
export function apiError(message: string, status = 500, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { error: message, ...extra },
    { status }
  );
}

/**
 * Catch-all handler for typed AppErrors and unknown exceptions.
 */
export function handleApiError(error: unknown) {
  const appError = error as AppError;

  if (appError?.type === 'not_found') {
    return apiError(appError.message, 404);
  }

  if (appError?.type === 'rate_limit') {
    return apiError(appError.message, 429, { retryAfter: appError.retryAfter });
  }

  if (appError?.type === 'private_repo') {
    return apiError(appError.message, 403);
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return apiError(message, 500);
}
