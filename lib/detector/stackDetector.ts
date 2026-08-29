/**
 * GitNode — Heuristic Tech Stack Detector
 * Auto-detect technologies used in a repository from config and manifest files.
 */

import type { TechStackItem } from '@/types/techStack';
import { TECH_MAP, PYTHON_TECH_MAP } from '@/lib/constants/techMap';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Detect tech stack items from package.json dependency manifests.
 */
export function detectFromPackageJson(content: string): TechStackItem[] {
  try {
    const pkg: PackageJson = JSON.parse(content);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const items: TechStackItem[] = [];
    const seen = new Set<string>();

    for (const [dep, version] of Object.entries(allDeps)) {
      const tech = TECH_MAP[dep];
      if (tech && !seen.has(tech.name)) {
        seen.add(tech.name);
        items.push({ ...tech, version: version.replace(/[\^~>=<]/g, '') });
      }
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * Detect tech stack items from requirements.txt content.
 */
export function detectFromRequirements(content: string): TechStackItem[] {
  const items: TechStackItem[] = [];
  const seen = new Set<string>();

  for (const line of content.split('\n')) {
    const name = line.split(/[=<>!]/)[0].trim().toLowerCase();
    const tech = PYTHON_TECH_MAP[name];
    if (tech && !seen.has(tech.name)) {
      seen.add(tech.name);
      items.push({ ...tech });
    }
  }

  items.unshift({ name: 'Python', icon: '🐍', category: 'language' });
  return items;
}

/**
 * Detect repository tech stack from configuration file contents.
 * @param files - Map of filename -> content string
 * @returns Array of detected unique TechStackItems
 */
export function detectTechStack(files: Record<string, string>): TechStackItem[] {
  const items: TechStackItem[] = [];
  const seen = new Set<string>();

  const addUnique = (item: TechStackItem) => {
    if (!seen.has(item.name)) {
      seen.add(item.name);
      items.push(item);
    }
  };

  if (files['package.json']) {
    for (const item of detectFromPackageJson(files['package.json'])) addUnique(item);
  }
  if (files['requirements.txt']) {
    for (const item of detectFromRequirements(files['requirements.txt'])) addUnique(item);
  }
  if (files['Cargo.toml']) {
    addUnique({ name: 'Rust', icon: '🦀', category: 'language' });
  }
  if (files['go.mod']) {
    addUnique({ name: 'Go', icon: '🐹', category: 'language' });
  }
  if (files['pom.xml']) {
    addUnique({ name: 'Java (Maven)', icon: '☕', category: 'language' });
  }
  if (files['build.gradle'] || files['build.gradle.kts']) {
    addUnique({ name: 'Java/Kotlin (Gradle)', icon: '🐘', category: 'language' });
  }
  if (files['Dockerfile'] || files['docker-compose.yml'] || files['docker-compose.yaml']) {
    addUnique({ name: 'Docker', icon: '🐳', category: 'devops' });
  }
  if (files['.github']) {
    addUnique({ name: 'GitHub Actions', icon: '🤖', category: 'devops' });
  }

  return items;
}
