import { describe, it, expect } from 'vitest';
import {
  extensionOf,
  validUploadName,
  isServerUploadPath,
  tokenMatches,
} from '@/lib/gallery/validate';

describe('extensionOf', () => {
  it('accepts whitelisted extensions case-insensitively', () => {
    expect(extensionOf('IMG_1234.JPG')).toBe('jpg');
    expect(extensionOf('pic.webp')).toBe('webp');
  });
  it('rejects everything else', () => {
    expect(extensionOf('script.exe')).toBeNull();
    expect(extensionOf('noext')).toBeNull();
    expect(extensionOf('sneaky.jpg.exe')).toBeNull();
  });
});

describe('validUploadName', () => {
  it('trims and caps at 100', () => {
    expect(validUploadName('  Aunt Salma  ')).toBe('Aunt Salma');
    expect(validUploadName('x'.repeat(150))!.length).toBe(100);
    expect(validUploadName('   ')).toBeNull();
  });
});

describe('isServerUploadPath', () => {
  it('accepts server-shaped paths only', () => {
    expect(
      isServerUploadPath('uploads/0b3a2c1d-1111-4222-8333-abcdefabcdef.jpg'),
    ).toBe(true);
    expect(isServerUploadPath('uploads/../secrets.txt')).toBe(false);
    expect(
      isServerUploadPath('other/0b3a2c1d-1111-4222-8333-abcdefabcdef.jpg'),
    ).toBe(false);
  });
});

describe('tokenMatches', () => {
  it('matches equal tokens, rejects others and null expected', () => {
    expect(tokenMatches('secret-token', 'secret-token')).toBe(true);
    expect(tokenMatches('wrong', 'secret-token')).toBe(false);
    expect(tokenMatches('anything', null)).toBe(false);
  });
});
