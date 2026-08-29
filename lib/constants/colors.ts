/**
 * GitNode — Extension & Node Color Palette Constants
 */

export interface ExtensionColorScheme {
  bg: string;
  glow: string;
  text: string;
}

export const EXTENSION_COLORS: Record<string, ExtensionColorScheme> = {
  ts: { bg: '#3178c6', glow: '#3178c640', text: '#93c5fd' },
  tsx: { bg: '#3178c6', glow: '#3178c640', text: '#93c5fd' },
  js: { bg: '#f7df1e', glow: '#f7df1e40', text: '#fde68a' },
  jsx: { bg: '#f7df1e', glow: '#f7df1e40', text: '#fde68a' },
  py: { bg: '#3572A5', glow: '#3572A540', text: '#6ee7b7' },
  rs: { bg: '#dea584', glow: '#dea58440', text: '#fdba74' },
  go: { bg: '#00ADD8', glow: '#00ADD840', text: '#67e8f9' },
  java: { bg: '#b07219', glow: '#b0721940', text: '#fdba74' },
  kt: { bg: '#A97BFF', glow: '#A97BFF40', text: '#c4b5fd' },
  css: { bg: '#e34c8f', glow: '#e34c8f40', text: '#f9a8d4' },
  scss: { bg: '#e34c8f', glow: '#e34c8f40', text: '#f9a8d4' },
  json: { bg: '#f97316', glow: '#f9731640', text: '#fdba74' },
  png: { bg: '#10b981', glow: '#10b98140', text: '#6ee7b7' },
  jpg: { bg: '#14b8a6', glow: '#14b8a640', text: '#5eead4' },
  jpeg: { bg: '#14b8a6', glow: '#14b8a640', text: '#5eead4' },
  svg: { bg: '#8b5cf6', glow: '#8b5cf640', text: '#c4b5fd' },
  gif: { bg: '#ec4899', glow: '#ec489940', text: '#f472b6' },
  webp: { bg: '#06b6d4', glow: '#06b6d440', text: '#67e8f9' },
  ico: { bg: '#f59e0b', glow: '#f59e0b40', text: '#fcd34d' },
  md: { bg: '#6b7280', glow: '#6b728040', text: '#9ca3af' },
  html: { bg: '#e34f26', glow: '#e34f2640', text: '#fca5a5' },
  yml: { bg: '#cb171e', glow: '#cb171e40', text: '#fca5a5' },
  yaml: { bg: '#cb171e', glow: '#cb171e40', text: '#fca5a5' },
  toml: { bg: '#9c4221', glow: '#9c422140', text: '#fdba74' },
  default: { bg: '#475569', glow: '#47556940', text: '#94a3b8' },
};

/**
 * Get the color scheme for a given file extension.
 * @param ext - File extension without the leading dot
 */
export function getExtensionColor(ext: string): ExtensionColorScheme {
  return EXTENSION_COLORS[ext.toLowerCase()] || EXTENSION_COLORS.default;
}
