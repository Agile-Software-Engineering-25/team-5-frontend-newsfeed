import useApi from '../hooks/useApi';
import type {
  NewsPostCreate,
  NewsPostUpdate,
  NewsPostRead,
  NewsPostHistoryItem,
} from '@/types/newsfeed';

type ListParams = { filter?: string; signal?: AbortSignal };

export default function useNewsfeed() {
  const api = useApi();

  return {
    createPost(body: NewsPostCreate) {
      return api.post<NewsPostRead>('/api/newsfeed', body);
    },
    listPosts(params?: ListParams) {
      return api.get<NewsPostRead[]>('/api/newsfeed', {
        query: params?.filter,
        signal: params?.signal,
      });
    },
    updatePost(id: string, body: NewsPostUpdate, version?: number | string) {
      return api.put<NewsPostRead>(`/api/newsfeed/${id}`, body, {
        ifMatch: version,
      });
    },
    deletePost(id: string) {
      return api.del<void>(`/api/newsfeed/${id}`);
    },
    getHistory(id: string, signal?: AbortSignal) {
      return api.get<NewsPostHistoryItem[]>(`/api/newsfeed/${id}/history`, {
        signal,
      });
    },
  };
}
