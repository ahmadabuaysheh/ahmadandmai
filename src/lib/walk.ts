export function walkProgress(
  startIso: string,
  targetIso: string,
  nowMs: number,
): number {
  const start = Date.parse(startIso);
  const end = Date.parse(targetIso);
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (nowMs - start) / (end - start)));
}
