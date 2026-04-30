/**
 * RepoLens — GitHub API Wrapper
 * Uses Octokit.js to interact with the GitHub REST API v3.
 * Supports optional authentication via GITHUB_TOKEN env variable.
 */

import { Octokit } from '@octokit/rest';
import type {
  RepoMetadata,
  FileTreeNode,
  LanguageStats,
  Contributor,
  AppError,
} from '@/types';

/** Create an Octokit instance with optional auth token */
function createOctokit(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  return new Octokit({
    auth: token || undefined,
    request: {
      timeout: 15000,
    },
  });
}

/**
 * Retry a function with exponential backoff.
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns The result of the function
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
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

      // Don't retry 404s or 401s
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

/**
 * Fetch repository metadata from GitHub.
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Structured repository metadata
 */
export async function fetchRepoMetadata(owner: string, repo: string): Promise<RepoMetadata> {
  const octokit = createOctokit();

  try {
    const { data } = await withRetry(() =>
      octokit.repos.get({ owner, repo })
    );

    return {
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      owner: {
        login: data.owner.login,
        avatarUrl: data.owner.avatar_url,
      },
      stars: data.stargazers_count,
      forks: data.forks_count,
      watchers: data.watchers_count,
      openIssues: data.open_issues_count,
      defaultBranch: data.default_branch,
      language: data.language,
      license: data.license?.spdx_id || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      size: data.size,
      topics: data.topics || [],
      isPrivate: data.private,
      htmlUrl: data.html_url,
    };
  } catch (error: unknown) {
    const err = error as { status?: number; type?: string };
    if (err.type === 'rate_limit') throw error;
    if (err.status === 404) {
      const notFoundError: AppError = {
        type: 'not_found',
        message: `Repository ${owner}/${repo} not found`,
      };
      throw notFoundError;
    }
    if (err.status === 401 || err.status === 403) {
      const privateError: AppError = {
        type: 'private_repo',
        message: 'This repository is private. Please add a GitHub token.',
      };
      throw privateError;
    }
    throw error;
  }
}

/**
 * Fetch the complete file tree using GitHub's Git Trees API (recursive).
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Array of file tree nodes
 */
export async function fetchFileTree(owner: string, repo: string): Promise<FileTreeNode[]> {
  const octokit = createOctokit();

  try {
    // First get the default branch
    const { data: repoData } = await withRetry(() =>
      octokit.repos.get({ owner, repo })
    );

    // Fetch tree recursively
    const { data: treeData } = await withRetry(() =>
      octokit.git.getTree({
        owner,
        repo,
        tree_sha: repoData.default_branch,
        recursive: 'true',
      })
    );

    if (treeData.truncated) {
      console.warn('File tree was truncated by GitHub API (repo too large)');
    }

    // Convert flat tree to nested structure
    const root: FileTreeNode[] = [];
    const dirMap = new Map<string, FileTreeNode>();

    // Sort so directories come before files
    const sortedItems = treeData.tree.sort((a, b) => {
      if (a.type === 'tree' && b.type !== 'tree') return -1;
      if (a.type !== 'tree' && b.type === 'tree') return 1;
      return (a.path || '').localeCompare(b.path || '');
    });

    for (const item of sortedItems) {
      if (!item.path || !item.sha) continue;

      const parts = item.path.split('/');
      const name = parts[parts.length - 1];
      const extension = item.type === 'blob' ? name.split('.').pop() || '' : undefined;

      const node: FileTreeNode = {
        path: item.path,
        name,
        type: item.type === 'tree' ? 'directory' : 'file',
        size: item.size,
        sha: item.sha,
        extension,
        children: item.type === 'tree' ? [] : undefined,
      };

      if (item.type === 'tree') {
        dirMap.set(item.path, node);
      }

      // Find parent directory
      const parentPath = parts.slice(0, -1).join('/');
      if (parentPath && dirMap.has(parentPath)) {
        dirMap.get(parentPath)!.children!.push(node);
      } else if (!parentPath) {
        root.push(node);
      }
    }

    return root;
  } catch (error: unknown) {
    const err = error as { type?: string };
    if (err.type === 'rate_limit' || err.type === 'not_found' || err.type === 'private_repo') {
      throw error;
    }
    throw error;
  }
}

/**
 * Fetch the content of a single file from the repository.
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param path - File path within the repository
 * @returns File content as a string
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const octokit = createOctokit();

  try {
    const { data } = await withRetry(() =>
      octokit.repos.getContent({ owner, repo, path })
    );

    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error('Path is not a file');
    }

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch (error: unknown) {
    const err = error as { type?: string; status?: number };
    if (err.type === 'rate_limit') throw error;
    if (err.status === 404) {
      const notFoundError: AppError = {
        type: 'not_found',
        message: `File not found: ${path}`,
      };
      throw notFoundError;
    }
    throw error;
  }
}

/**
 * Fetch language distribution for a repository.
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns Object mapping language names to byte counts
 */
export async function fetchLanguages(owner: string, repo: string): Promise<LanguageStats> {
  const octokit = createOctokit();

  try {
    const { data } = await withRetry(() =>
      octokit.repos.listLanguages({ owner, repo })
    );
    return data;
  } catch {
    return {};
  }
}

/**
 * Fetch top contributors for a repository.
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param limit - Maximum number of contributors to return
 * @returns Array of contributor info
 */
export async function fetchContributors(
  owner: string,
  repo: string,
  limit = 10
): Promise<Contributor[]> {
  const octokit = createOctokit();

  try {
    const { data } = await withRetry(() =>
      octokit.repos.listContributors({ owner, repo, per_page: limit })
    );

    return data.map((c) => ({
      login: c.login || 'unknown',
      avatarUrl: c.avatar_url || '',
      contributions: c.contributions,
      htmlUrl: c.html_url || '',
    }));
  } catch {
    return [];
  }
}
