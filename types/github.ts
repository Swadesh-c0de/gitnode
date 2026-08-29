/**
 * GitNode — GitHub API & File System Domain Types
 */

/** Repository metadata returned from GitHub API */
export interface RepoMetadata {
  name: string;
  fullName: string;
  description: string | null;
  owner: {
    login: string;
    avatarUrl: string;
  };
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  defaultBranch: string;
  language: string | null;
  license: string | null;
  createdAt: string;
  updatedAt: string;
  size: number;
  topics: string[];
  isPrivate: boolean;
  htmlUrl: string;
}

/** A single file or directory node from the GitHub tree API */
export interface FileTreeNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  sha: string;
  children?: FileTreeNode[];
  extension?: string;
  content?: string;
}

/** Language distribution mapping language names to byte counts */
export interface LanguageStats {
  [language: string]: number;
}

/** GitHub contributor profile & statistics */
export interface Contributor {
  login: string;
  avatarUrl: string;
  contributions: number;
  htmlUrl: string;
}

/** Response structure when fetching single file content */
export interface FileContentData {
  content: string;
  isBinary: boolean;
  isImage: boolean;
  downloadUrl?: string | null;
  size?: number;
}
