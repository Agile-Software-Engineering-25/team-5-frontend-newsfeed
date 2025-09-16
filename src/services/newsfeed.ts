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

/**
 * POST /newsfeed
 */
export function createPost(body: NewsPostCreate) {
  return apiClient.post<NewsPostRead>('/newsfeed', body);
}

/**
 * GET /newsfeed
 * Optional: ?filter=...
 */
export function listPosts(params?: ListParams) {
  return apiClient.get<NewsPostRead[]>('/newsfeed', {
    query: params?.filter ? { filter: params.filter } : undefined,
    signal: params?.signal,
  });
}

/**
 * PUT /newsfeed/{id}
 * Optional optimistic concurrency per ETag via If-Match
 */
export function updatePost(
  id: string,
  body: NewsPostUpdate,
  version?: number | string
) {
  return apiClient.put<NewsPostRead>(`/newsfeed/${id}`, body, {
    ifMatch: version, // apiClient sollte dies als "If-Match" Header setzen
  });
}

/**
 * DELETE /newsfeed/{id}
 */
export function deletePost(id: string) {
  return apiClient.del<void>(`/newsfeed/${id}`);
}

/**
 * GET /newsfeed/{id}/history
 */
export function getHistory(id: string, signal?: AbortSignal) {
  return apiClient.get<NewsPostHistoryItem[]>(`/newsfeed/${id}/history`, {
    signal,
  });
}
