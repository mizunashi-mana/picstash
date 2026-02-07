// This file is deprecated. Use ApiClient from @/shared instead.
// Types should be imported from @picstash/api.
//
// Migration guide:
//   Before:
//     import { uploadArchive, getArchiveSession } from '@/features/archive-import/api';
//     const session = await uploadArchive(file);
//
//   After:
//     import { useApiClient } from '@/shared';
//     import type { ArchiveSession } from '@picstash/api';
//     const apiClient = useApiClient();
//     const session = await apiClient.archiveImport.upload(file);

export {};
