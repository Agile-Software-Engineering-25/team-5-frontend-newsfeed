/*
// src/services/newsfeed.ts
import { apiClient } from './apiClient';
import type {
  NewsPostCreate,
  NewsPostUpdate,
  NewsPostRead,
  NewsPostHistoryItem,
} from '@/types/newsfeed';

type ListParams = {
  filter?: string;
  signal?: AbortSignal;
};

/!**
 * POST /newsfeed
 *!/
export function createPost(body: NewsPostCreate) {
  console.log('createPost:');
  console.log(body);
  return apiClient.post<NewsPostRead>('/api/newsfeed', body);
}

/!**
 * GET /newsfeed
 * Optional: ?filter=...
 *!/
export async function listPosts(params?: ListParams) {
  const result = await apiClient.get<NewsPostRead[]>('/api/newsfeed', {
    query: params?.filter ? params?.filter : undefined,
    signal: params?.signal,
  });
  console.log('Result');
  console.log(result);
  return result;
}

/!**
 * PUT /newsfeed/{id}
 * Optional optimistic concurrency per ETag via If-Match
 *!/
export function updatePost(
  id: string,
  body: NewsPostUpdate,
  version?: number | string
) {
  console.log('updatePost:');
  console.log(body);
  return apiClient.put<NewsPostRead>(`/api/newsfeed/${id}`, body, {
    ifMatch: version, // apiClient sollte dies als "If-Match" Header setzen
  });
}

/!**
 * DELETE /newsfeed/{id}
 *!/
export function deletePost(id: string) {
  console.log('deletePost:');
  console.log(id);
  return apiClient.del<void>(`/api/newsfeed/${id}`);
}

/!**
 * GET /newsfeed/{id}/history
 *!/
export function getHistory(id: string, signal?: AbortSignal) {
  return apiClient.get<NewsPostHistoryItem[]>(`/api/newsfeed/${id}/history`, {
    signal,
  });
}
*/
