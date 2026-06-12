/** Arithmetic mean of an array. Returns 0 for empty arrays. */
export function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Population standard deviation. Accepts optional pre-computed mean. */
export function stdDev(arr: number[], avg?: number): number {
  if (arr.length < 2) return 0;
  const m   = avg ?? mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/** EMA smoothing multiplier for a given period. */
export function emaK(period: number): number {
  return 2 / (period + 1);
}

/** Clamp value within [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Deep clone via JSON round-trip — works for plain objects with numeric/boolean/array values. */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}
