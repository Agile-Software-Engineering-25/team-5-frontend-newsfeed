import { useMemo } from 'react';
import useAxiosInstance from '@/hooks/useAxiosInstance';
import { BACKEND_BASE_URL } from '@/config';

type RequestOpts = {
  query?: string;                // z.B. "filter=foo&limit=10"
  signal?: AbortSignal;
  headers?: Record<string, string>;
  ifMatch?: string | number;     // für ETags
  responseType?: 'json' | 'blob' | 'arraybuffer' | 'text';
};

function withQuery(path: string, query?: string) {
  return query ? `${path}?${query}` : path;
}

export default function useApiClient() {
  const axios = useAxiosInstance(BACKEND_BASE_URL);

  return useMemo(() => ({
    async get<T>(path: string, opts: RequestOpts = {}) {
      const url = withQuery(path, opts.query);
      const res = await axios.get<T>(url, {
        headers: opts.headers,
        signal: opts.signal,
        responseType: opts.responseType,
      });
      return res.data;
    },
    async post<T>(path: string, body?: unknown, opts: RequestOpts = {}) {
      const url = withQuery(path, opts.query);
      const res = await axios.post<T>(url, body, {
        headers: opts.headers,
        signal: opts.signal,
        responseType: opts.responseType,
      });
      return res.data;
    },
    async put<T>(path: string, body?: unknown, opts: RequestOpts = {}) {
      const url = withQuery(path, opts.query);
      const res = await axios.put<T>(url, body, {
        headers: {
          ...(opts.ifMatch !== undefined ? { 'If-Match': String(opts.ifMatch) } : {}),
          ...(opts.headers ?? {}),
        },
        signal: opts.signal,
        responseType: opts.responseType,
      });
      return res.data;
    },
    async del<T>(path: string, opts: RequestOpts = {}) {
      const url = withQuery(path, opts.query);
      const res = await axios.delete<T>(url, {
        headers: opts.headers,
        signal: opts.signal,
        responseType: opts.responseType,
      });
      // DELETE/204 hat oft kein Body => res.data kann undefined sein
      return (res.data as T) ?? (undefined as T);
    },
  }), [axios]);
}
