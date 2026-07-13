import { timingSafeEqual } from 'node:crypto';

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const NAME_MAX = 100;

export function extensionOf(filename: string): string | null {
  const m = /\.([A-Za-z0-9]+)$/.exec(filename.trim());
  const ext = m ? m[1].toLowerCase() : null;
  return ext && EXTENSIONS.includes(ext) ? ext : null;
}

export function validUploadName(name: string): string | null {
  const trimmed = name.trim().slice(0, NAME_MAX);
  return trimmed === '' ? null : trimmed;
}

const UPLOAD_PATH =
  /^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|gif)$/;

export function isServerUploadPath(path: string): boolean {
  return UPLOAD_PATH.test(path);
}

export function tokenMatches(
  provided: string,
  expected: string | null,
): boolean {
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
