/**
 * Label name value object with validation
 */
export class LabelName {
  private constructor(readonly value: string) {}

  static create(name: string): LabelName | null {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return null;
    }
    return new LabelName(trimmed);
  }

  static isValid(name: string): boolean {
    return name.trim().length > 0;
  }

  toString(): string {
    return this.value;
  }

  equals(other: LabelName): boolean {
    return this.value === other.value;
  }
}
