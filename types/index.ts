/**
 * GitNode — TypeScript Domain Interfaces & Types
 * Unified barrel export for all domain types across the application.
 */

// GitHub domain types
export * from './github';

// Visual Graph domain types
export * from './graph';

// Code & AST Parser domain types
export * from './parser';

// Tech Stack Detection types
export * from './techStack';

// Error handling types
export * from './error';

// Zustand Store state types
export * from './store';

// Backward compatibility bridge for extension color maps
export { EXTENSION_COLORS, getExtensionColor } from '@/lib/constants/colors';
export type { ExtensionColorScheme } from '@/lib/constants/colors';
