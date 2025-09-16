// src/services/newsfeed.ts
import { apiClient } from './apiClient';
import type {
  BlogPostCreate,
  BlogPostUpdate,
  BlogPostRead,
  BlogPostHistoryItem,
} from '@/types/newsfeed';

export function createPost(body: BlogPostCreate) {
  return apiClient.post<BlogPostRead>('/newsfeed', body);
}

export function listPosts(params?: { filter?: string; signal?: AbortSignal }) {
  return apiClient.get<BlogPostRead[]>('/newsfeed', {
    query: params?.filter ? { filter: params.filter } : undefined,
    signal: params?.signal,
  });
}

export function updatePost(
  id: string,
  body: BlogPostUpdate,
  version?: number | string
) {
  return apiClient.put<BlogPostRead>(`/newsfeed/${id}`, body, {
    ifMatch: version,
  });
}

export function deletePost(id: string) {
  return apiClient.del<void>(`/newsfeed/${id}`);
}

export function getHistory(id: string, signal?: AbortSignal) {
  return apiClient.get<BlogPostHistoryItem[]>(`/newsfeed/${id}/history`, {
    signal,
  });
}
