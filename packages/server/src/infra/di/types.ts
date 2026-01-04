export const TYPES = {
  // Repositories
  ImageRepository: Symbol.for('ImageRepository'),
  LabelRepository: Symbol.for('LabelRepository'),
  ImageAttributeRepository: Symbol.for('ImageAttributeRepository'),

  // Storage & Processing
  FileStorage: Symbol.for('FileStorage'),
  ImageProcessor: Symbol.for('ImageProcessor'),
} as const;
