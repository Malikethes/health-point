/**
 * Formats a number of seconds into a mm:ss string.
 * @param seconds The total number of seconds.
 * @returns A string in "mm:ss" or "hh:mm:ss" format.
 */
export const formatSeconds = (seconds: number): string => {
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);

  const ss = s.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');

  if (h > 0) {
    const hh = h.toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
};