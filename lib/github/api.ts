/**
 * GitNode — GitHub REST API Methods
 */

import type {
  RepoMetadata,
  FileTreeNode,
  LanguageStats,
  Contributor,
  FileContentData,
} from '@/types/github';
import type { AppError } from '@/types/error';
import { createOctokit } from './client';
import { withRetry } from './retry';

/**
 * Fetch repository metadata from GitHub.
 * @param owner - Repository owner
 * @param repo - Repository name
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
 * Fetch the recursive file tree using GitHub's Git Trees API.
 * @param owner - Repository owner
 * @param repo - Repository name
 */
export async function fetchFileTree(owner: string, repo: string): Promise<FileTreeNode[]> {
  const octokit = createOctokit();

  try {
    // 1. Get default branch
    const { data: repoData } = await withRetry(() =>
      octokit.repos.get({ owner, repo })
    );

    // 2. Fetch tree recursively
    const { data: treeData } = await withRetry(() =>
      octokit.git.getTree({
        owner,
        repo,
        tree_sha: repoData.default_branch,
        recursive: 'true',
      })
    );

    if (treeData.truncated) {
      console.warn('[GitNode] File tree was truncated by GitHub API (repo exceeds API limits)');
    }

    // Convert flat tree array to deeply nested FileTreeNode hierarchy
    const root: FileTreeNode[] = [];
    const dirMap = new Map<string, FileTreeNode>();

    // Sort directories before files
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
 * Images are converted to data URLs, and text files are decoded to utf-8.
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param path - File path within the repository
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<FileContentData> {
  const octokit = createOctokit();

  try {
    const { data } = await withRetry(() =>
      octokit.repos.getContent({ owner, repo, path })
    );

    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error('Path is not a file');
    }

    const ext = path.split('.').pop()?.toLowerCase() || '';
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'avif'];
    const isImage = imageExtensions.includes(ext);

    let mimeType = 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'svg') mimeType = 'image/svg+xml';
    else if (ext === 'gif') mimeType = 'image/gif';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'ico') mimeType = 'image/x-icon';
    else if (ext === 'bmp') mimeType = 'image/bmp';
    else if (ext === 'avif') mimeType = 'image/avif';

    let content = '';
    if (isImage) {
      const cleanBase64 = (data.content || '').replace(/\s/g, '');
      content = cleanBase64 ? `data:${mimeType};base64,${cleanBase64}` : (data.download_url || '');
    } else {
      content = Buffer.from(data.content || '', 'base64').toString('utf-8');
    }

    return {
      content,
      isBinary: isImage,
      isImage,
      downloadUrl: data.download_url || null,
      size: data.size,
    };
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
 * Fetch language byte distribution for a repository.
 * @param owner - Repository owner
 * @param repo - Repository name
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
 * @param limit - Maximum contributors to return (default: 10)
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
