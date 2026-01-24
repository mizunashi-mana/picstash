import { describe, expect, it } from 'vitest';
import {
  isNonEmptyString,
  trimOrUndefined,
} from '@/shared/validators/string-validators.js';

describe('isNonEmptyString', () => {
  it('should return true for non-empty string', () => {
    expect(isNonEmptyString('hello')).toBe(true);
  });

  it('should return true for string with leading/trailing spaces but content', () => {
    expect(isNonEmptyString('  hello  ')).toBe(true);
  });

  it('should return false for empty string', () => {
    expect(isNonEmptyString('')).toBe(false);
  });

  it('should return false for whitespace-only string', () => {
    expect(isNonEmptyString('   ')).toBe(false);
    expect(isNonEmptyString('\t\n')).toBe(false);
  });

  it('should return false for null', () => {
    expect(isNonEmptyString(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isNonEmptyString(undefined)).toBe(false);
  });

  it('should return false for number', () => {
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString(0)).toBe(false);
  });

  it('should return false for boolean', () => {
    expect(isNonEmptyString(true)).toBe(false);
    expect(isNonEmptyString(false)).toBe(false);
  });

  it('should return false for object', () => {
    expect(isNonEmptyString({})).toBe(false);
    expect(isNonEmptyString([])).toBe(false);
  });
});

describe('trimOrUndefined', () => {
  it('should return undefined for undefined input', () => {
    expect(trimOrUndefined(undefined)).toBeUndefined();
  });

  it('should return undefined for empty string', () => {
    expect(trimOrUndefined('')).toBeUndefined();
  });

  it('should return undefined for whitespace-only string', () => {
    expect(trimOrUndefined('   ')).toBeUndefined();
    expect(trimOrUndefined('\t\n')).toBeUndefined();
  });

  it('should trim and return non-empty string', () => {
    expect(trimOrUndefined('  hello  ')).toBe('hello');
  });

  it('should return string as-is if already trimmed', () => {
    expect(trimOrUndefined('hello')).toBe('hello');
  });

  it('should trim leading whitespace', () => {
    expect(trimOrUndefined('   hello')).toBe('hello');
  });

  it('should trim trailing whitespace', () => {
    expect(trimOrUndefined('hello   ')).toBe('hello');
  });
});
