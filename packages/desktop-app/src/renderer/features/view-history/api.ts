// This file is deprecated. Use ApiClient from @/shared instead.
// Types should be imported from @picstash/api.
//
// Migration guide:
//   Before:
//     import { recordViewStart, fetchViewHistory } from '@/features/view-history/api';
//     const history = await recordViewStart(imageId);
//
//   After:
//     import { useApiClient } from '@/shared';
//     import type { ViewHistory } from '@picstash/api';
//     const apiClient = useApiClient();
//     const history = await apiClient.viewHistory.recordStart(imageId);

export {};
