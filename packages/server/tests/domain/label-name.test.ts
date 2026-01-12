import { describe, expect, it } from 'vitest';
import {
  LabelName,
  LABEL_NAME_MAX_LENGTH,
} from '@/domain/label/LabelName';

describe('LabelName', () => {
  describe('validate', () => {
    it('should return null for valid names', () => {
      expect(LabelName.validate('キャラクター')).toBeNull();
      expect(LabelName.validate('Test Label')).toBeNull();
      expect(LabelName.validate('a')).toBeNull();
    });

    it('should return EMPTY for empty strings', () => {
      expect(LabelName.validate('')).toBe('EMPTY');
      expect(LabelName.validate('   ')).toBe('EMPTY');
      expect(LabelName.validate('\t\n')).toBe('EMPTY');
    });

    it('should return TOO_LONG for names exceeding max length', () => {
      const longName = 'a'.repeat(LABEL_NAME_MAX_LENGTH + 1);
      expect(LabelName.validate(longName)).toBe('TOO_LONG');
    });

    it('should accept names at exactly max length', () => {
      const exactName = 'a'.repeat(LABEL_NAME_MAX_LENGTH);
      expect(LabelName.validate(exactName)).toBeNull();
    });
  });

  describe('create', () => {
    it('should create LabelName for valid names', () => {
      const labelName = LabelName.create('Test');
      expect(labelName).not.toBeNull();
      expect(labelName?.value).toBe('Test');
    });

    it('should trim whitespace from names', () => {
      const labelName = LabelName.create('  Test  ');
      expect(labelName?.value).toBe('Test');
    });

    it('should return null for empty names', () => {
      expect(LabelName.create('')).toBeNull();
      expect(LabelName.create('   ')).toBeNull();
    });

    it('should return null for names exceeding max length', () => {
      const longName = 'a'.repeat(LABEL_NAME_MAX_LENGTH + 1);
      expect(LabelName.create(longName)).toBeNull();
    });
  });

  describe('isValid', () => {
    it('should return true for valid names', () => {
      expect(LabelName.isValid('Test')).toBe(true);
      expect(LabelName.isValid('  Test  ')).toBe(true);
    });

    it('should return false for invalid names', () => {
      expect(LabelName.isValid('')).toBe(false);
      expect(LabelName.isValid('   ')).toBe(false);
      expect(LabelName.isValid('a'.repeat(LABEL_NAME_MAX_LENGTH + 1))).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the label name string', () => {
      const labelName = LabelName.create('Test');
      expect(labelName?.toString()).toBe('Test');
    });
  });

  describe('equals', () => {
    it('should return true for same names', () => {
      const a = LabelName.create('Test');
      const b = LabelName.create('Test');
      expect(a?.equals(b!)).toBe(true);
    });

    it('should return false for different names', () => {
      const a = LabelName.create('Test1');
      const b = LabelName.create('Test2');
      expect(a?.equals(b!)).toBe(false);
    });
  });

  describe('LABEL_NAME_MAX_LENGTH', () => {
    it('should be 100 characters', () => {
      expect(LABEL_NAME_MAX_LENGTH).toBe(100);
    });
  });
});
