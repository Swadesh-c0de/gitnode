/**
 * GitNode — Octokit GitHub Client Factory
 */

import { Octokit } from '@octokit/rest';
import { API_TIMEOUT_MS } from '@/lib/constants/limits';

/**
 * Create an Octokit instance with optional authorization token.
 */
export function createOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  return new Octokit({
    auth: token || undefined,
    request: {
      timeout: API_TIMEOUT_MS,
    },
  });
}
