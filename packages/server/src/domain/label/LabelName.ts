/** Maximum length for label names */
export const LABEL_NAME_MAX_LENGTH = 100;

export type LabelNameValidationError = 'EMPTY' | 'TOO_LONG';

/**
 * Label name value object with validation
 */
export class LabelName {
  private constructor(readonly value: string) {}

  static create(name: string): LabelName | null {
    const result = LabelName.validate(name);
    if (result !== null) {
      return null;
    }
    return new LabelName(name.trim());
  }

  /**
   * Validate a label name and return error if invalid
   */
  static validate(name: string): LabelNameValidationError | null {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return 'EMPTY';
    }
    if (trimmed.length > LABEL_NAME_MAX_LENGTH) {
      return 'TOO_LONG';
    }
    return null;
  }

  static isValid(name: string): boolean {
    return LabelName.validate(name) === null;
  }

  toString(): string {
    return this.value;
  }

  equals(other: LabelName): boolean {
    return this.value === other.value;
  }
}
