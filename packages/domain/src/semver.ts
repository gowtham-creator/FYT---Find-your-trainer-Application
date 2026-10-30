/** Minimal x.y.z comparison for the `minAppVersion` gate. No pre-release tags. */

function parts(v: string): [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** -1, 0 or 1. Throws on a malformed version. */
export function compareVersions(a: string, b: string): number {
  const pa = parts(a);
  const pb = parts(b);
  if (!pa || !pb) throw new RangeError(`Invalid version "${pa ? b : a}"`);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  return 0;
}

/**
 * True when `current` is below `min`. A malformed `current` counts as outdated
 * (fail closed); a malformed `min` never blocks (a bad config must not lock out every user).
 */
export function isBelowMin(current: string | null | undefined, min: string | null | undefined): boolean {
  if (!min || !parts(min)) return false;
  if (!current || !parts(current)) return true;
  return compareVersions(current, min) < 0;
}
