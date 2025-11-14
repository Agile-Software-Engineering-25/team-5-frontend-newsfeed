// services/useApiClient.ts
import { useCallback } from 'react';
import useAxiosInstance from '@/hooks/useAxiosInstance';
import { BACKEND_BASE_URL } from '@/config';

export default function useApiClient() {
  const axios = useAxiosInstance(BACKEND_BASE_URL);

  const get = useCallback(async <T,>(path: string, opts: any = {}) => {
    const url = opts.query ? `${path}?${opts.query}` : path;
    console.log('Axios GET', { url, headers: opts.headers, signal: opts.signal });
    const res = await axios.get<T>(url, { headers: opts.headers, signal: opts.signal, responseType: opts.responseType });
    return res.data;
  }, [axios]);

  const post = useCallback(async <T,>(path: string, body?: unknown, opts: any = {}) => {
    const url = opts.query ? `${path}?${opts.query}` : path;
    console.log('Axios POST', { url, headers: opts.headers, body });
    const res = await axios.post<T>(url, body, { headers: opts.headers, signal: opts.signal, responseType: opts.responseType });
    return res.data;
  }, [axios]);

  const put = useCallback(async <T,>(path: string, body?: unknown, opts: any = {}) => {
    const url = opts.query ? `${path}?${opts.query}` : path;
    console.log('Axios PUT', { url, headers: opts.headers, body, ifMatch: opts.ifMatch });
    const res = await axios.put<T>(url, body, {
      headers: { ...(opts.ifMatch !== undefined ? { 'If-Match': String(opts.ifMatch) } : {}), ...(opts.headers ?? {}) },
      signal: opts.signal, responseType: opts.responseType
    });
    return res.data;
  }, [axios]);

  const del = useCallback(async <T,>(path: string, opts: any = {}) => {
    const url = opts.query ? `${path}?${opts.query}` : path;
    console.log('Axios DELETE', { url, headers: opts.headers });
    const res = await axios.delete<T>(url, { headers: opts.headers, signal: opts.signal, responseType: opts.responseType });
    return (res.data as T) ?? (undefined as T);
  }, [axios]);

  return { get, post, put, del };
}
