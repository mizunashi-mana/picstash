import type { Job } from '@/widgets/job-status/api/jobs';

/** ジョブタイプの日本語表示名を取得 */
export function getJobTypeName(type: string): string {
  switch (type) {
    case 'caption-generation':
      return '説明文生成';
    default:
      return type;
  }
}

/** ペイロードから対象の画像IDを取得 */
export function getImageId(job: Job): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- job.payload is unknown type
  const payload = job.payload as { imageId?: string } | undefined;
  return payload?.imageId;
}

/** ペイロードから対象の説明を取得 */
export function getJobTargetDescription(job: Job): string {
  const imageId = getImageId(job);
  if (imageId !== undefined) {
    return `画像 ${imageId.slice(0, 8)}...`;
  }
  return '';
}
