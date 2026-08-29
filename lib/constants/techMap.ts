/**
 * GitNode — Tech Stack Mapping Constants
 */

import type { TechStackItem } from '@/types/techStack';

export const TECH_MAP: Record<string, Omit<TechStackItem, 'version'>> = {
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

  // DevOps & Tools
  typescript: { name: 'TypeScript', icon: '🔷', category: 'language' },
  webpack: { name: 'Webpack', icon: '📦', category: 'tool' },
  vite: { name: 'Vite', icon: '⚡', category: 'tool' },
  esbuild: { name: 'esbuild', icon: '⚡', category: 'tool' },
  jest: { name: 'Jest', icon: '🃏', category: 'tool' },
  vitest: { name: 'Vitest', icon: '⚡', category: 'tool' },
  eslint: { name: 'ESLint', icon: '📏', category: 'tool' },
  prettier: { name: 'Prettier', icon: '✨', category: 'tool' },
  docker: { name: 'Docker', icon: '🐳', category: 'devops' },
  'framer-motion': { name: 'Framer Motion', icon: '🎭', category: 'frontend' },
  radix: { name: 'Radix UI', icon: '🫐', category: 'frontend' },
  '@radix-ui/react-primitive': { name: 'Radix UI', icon: '🫐', category: 'frontend' },
  'shadcn-ui': { name: 'Shadcn UI', icon: '🎨', category: 'frontend' },
  remix: { name: 'Remix', icon: '💿', category: 'frontend' },
  '@remix-run/react': { name: 'Remix', icon: '💿', category: 'frontend' },
  astro: { name: 'Astro', icon: '🚀', category: 'frontend' },
  trpc: { name: 'tRPC', icon: '🪄', category: 'backend' },
  '@trpc/server': { name: 'tRPC', icon: '🪄', category: 'backend' },
  bun: { name: 'Bun', icon: '🥟', category: 'tool' },
  deno: { name: 'Deno', icon: '🦕', category: 'tool' },
  zustand: { name: 'Zustand', icon: '🐻', category: 'tool' },
  redux: { name: 'Redux', icon: '⚛️', category: 'tool' },
  '@tanstack/react-query': { name: 'React Query', icon: '📡', category: 'tool' },
};

export const PYTHON_TECH_MAP: Record<string, Omit<TechStackItem, 'version'>> = {
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

export const CONFIG_FILE_NAMES = [
  'package.json',
  'requirements.txt',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.github',
] as const;
