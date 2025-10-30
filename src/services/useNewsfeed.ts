// services/useNewsfeed.ts
import { useCallback } from 'react';
import useApiClient from '../hooks/useApi.ts';
import type { NewsPostCreate, NewsPostUpdate, NewsPostRead, NewsPostHistoryItem } from '@/types/newsfeed';

export default function useNewsfeed() {
  const api = useApiClient();

  const createPost = useCallback((body: NewsPostCreate) =>
    api.post<NewsPostRead>('/api/newsfeed', body), [api]);

  const listPosts = useCallback((params?: { filter?: string; signal?: AbortSignal; }) =>
    api.get<NewsPostRead[]>('/api/newsfeed', { query: params?.filter, signal: params?.signal }), [api]);

  const updatePost = useCallback((id: string, body: NewsPostUpdate, version?: number | string) =>
    api.put<NewsPostRead>(`/api/newsfeed/${id}`, body, { ifMatch: version }), [api]);

  const deletePost = useCallback((id: string) =>
    api.del<void>(`/api/newsfeed/${id}`), [api]);

  const getHistory = useCallback((id: string, signal?: AbortSignal) =>
    api.get<NewsPostHistoryItem[]>(`/api/newsfeed/${id}/history`, { signal }), [api]);

  return { createPost, listPosts, updatePost, deletePost, getHistory };
}
