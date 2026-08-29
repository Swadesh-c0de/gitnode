/**
 * GitNode — Tech Stack Detection Domain Types
 */

export type TechCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'language'
  | 'tool';

/** A detected technology item in the repository */
export interface TechStackItem {
  name: string;
  icon: string;
  category: TechCategory;
  version?: string;
}
