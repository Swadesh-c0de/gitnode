/**
 * RepoLens — Tech Stack Detector
 * Auto-detect technologies used in a repository from config files.
 */

import type { TechStackItem } from '@/types';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/** Known technology mappings */
const TECH_MAP: Record<string, Omit<TechStackItem, 'version'>> = {
  // Frontend
  react: { name: 'React', icon: '⚛️', category: 'frontend' },
  'react-dom': { name: 'React', icon: '⚛️', category: 'frontend' },
  next: { name: 'Next.js', icon: '▲', category: 'frontend' },
  vue: { name: 'Vue.js', icon: '💚', category: 'frontend' },
  nuxt: { name: 'Nuxt', icon: '💚', category: 'frontend' },
  svelte: { name: 'Svelte', icon: '🔥', category: 'frontend' },
  angular: { name: 'Angular', icon: '🅰️', category: 'frontend' },
  '@angular/core': { name: 'Angular', icon: '🅰️', category: 'frontend' },
  tailwindcss: { name: 'Tailwind CSS', icon: '🎨', category: 'frontend' },
  'styled-components': { name: 'Styled Components', icon: '💅', category: 'frontend' },

  // Backend
  express: { name: 'Express', icon: '🚂', category: 'backend' },
  fastify: { name: 'Fastify', icon: '⚡', category: 'backend' },
  koa: { name: 'Koa', icon: '🍃', category: 'backend' },
  nestjs: { name: 'NestJS', icon: '🐈', category: 'backend' },
  '@nestjs/core': { name: 'NestJS', icon: '🐈', category: 'backend' },

  // Database
  prisma: { name: 'Prisma', icon: '💎', category: 'database' },
  '@prisma/client': { name: 'Prisma', icon: '💎', category: 'database' },
  mongoose: { name: 'MongoDB', icon: '🍃', category: 'database' },
  typeorm: { name: 'TypeORM', icon: '🗄️', category: 'database' },
  sequelize: { name: 'Sequelize', icon: '🗄️', category: 'database' },
  pg: { name: 'PostgreSQL', icon: '🐘', category: 'database' },
  redis: { name: 'Redis', icon: '🔴', category: 'database' },
  ioredis: { name: 'Redis', icon: '🔴', category: 'database' },

  // DevOps / Tools
  typescript: { name: 'TypeScript', icon: '🔷', category: 'language' },
  webpack: { name: 'Webpack', icon: '📦', category: 'tool' },
  vite: { name: 'Vite', icon: '⚡', category: 'tool' },
  esbuild: { name: 'esbuild', icon: '⚡', category: 'tool' },
  jest: { name: 'Jest', icon: '🃏', category: 'tool' },
  vitest: { name: 'Vitest', icon: '⚡', category: 'tool' },
  eslint: { name: 'ESLint', icon: '📏', category: 'tool' },
  prettier: { name: 'Prettier', icon: '✨', category: 'tool' },
  docker: { name: 'Docker', icon: '🐳', category: 'devops' },
};

/**
 * Detect tech stack from a package.json content string.
 */
function detectFromPackageJson(content: string): TechStackItem[] {
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
 * Detect tech stack from requirements.txt content.
 */
function detectFromRequirements(content: string): TechStackItem[] {
  const items: TechStackItem[] = [];
  const pyMap: Record<string, Omit<TechStackItem, 'version'>> = {
    django: { name: 'Django', icon: '🎸', category: 'backend' },
    flask: { name: 'Flask', icon: '🧪', category: 'backend' },
    fastapi: { name: 'FastAPI', icon: '⚡', category: 'backend' },
    sqlalchemy: { name: 'SQLAlchemy', icon: '🗄️', category: 'database' },
    celery: { name: 'Celery', icon: '🥬', category: 'backend' },
    numpy: { name: 'NumPy', icon: '🔢', category: 'tool' },
    pandas: { name: 'Pandas', icon: '🐼', category: 'tool' },
    tensorflow: { name: 'TensorFlow', icon: '🧠', category: 'tool' },
    pytorch: { name: 'PyTorch', icon: '🔥', category: 'tool' },
    torch: { name: 'PyTorch', icon: '🔥', category: 'tool' },
  };

  const seen = new Set<string>();
  for (const line of content.split('\n')) {
    const name = line.split(/[=<>!]/)[0].trim().toLowerCase();
    const tech = pyMap[name];
    if (tech && !seen.has(tech.name)) {
      seen.add(tech.name);
      items.push({ ...tech });
    }
  }

  items.unshift({ name: 'Python', icon: '🐍', category: 'language' });
  return items;
}

/**
 * Detect tech stack from the presence of config files.
 * @param files - Map of filename → content for known config files
 * @returns Detected tech stack items
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
