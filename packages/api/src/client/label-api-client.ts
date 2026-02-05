/**
 * Label API Client Interface
 */

import type {
  CreateLabelInput,
  Label,
  UpdateLabelInput,
} from '@/labels.js';

export interface LabelApiClient {
  /** ラベル一覧取得 */
  list: () => Promise<Label[]>;

  /** ラベル詳細取得 */
  detail: (labelId: string) => Promise<Label>;

  /** ラベル作成 */
  create: (input: CreateLabelInput) => Promise<Label>;

  /** ラベル更新 */
  update: (labelId: string, input: UpdateLabelInput) => Promise<Label>;

  /** ラベル削除 */
  delete: (labelId: string) => Promise<void>;
}
