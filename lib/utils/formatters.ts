/**
 * GitNode — Shared Data Formatters
 */

/**
 * Format raw byte size into human-readable strings (B, KB, MB, GB).
 */
export function formatBytes(bytes?: number | null): string {
  if (bytes === undefined || bytes === null) return 'N/A';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format large numbers with metric suffixes (e.g. 1.2K, 3.5M).
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Calculate the reduced aspect ratio string (e.g. 16:9, 4:3, 1:1) from pixel dimensions.
 */
export function getAspectRatio(width: number, height: number): string {
  if (!width || !height) return '';
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const rw = width / divisor;
  const rh = height / divisor;
  if (rw > 32 || rh > 32) return `${(width / height).toFixed(2)}:1`;
  return `${rw}:${rh}`;
}
