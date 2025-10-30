// src/services/apiClient.ts
const BASE_URL = 'http://localhost:8080';
//const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://sau-portal.de/api/newsfeed';

let dynamicHeadersProvider: () => Record<string, string> = () => ({});

export function setDynamicHeadersProvider(fn: () => Record<string, string>) {
    dynamicHeadersProvider = fn;
}


type RequestOpts = {
  query?: string;
  body?: unknown;
  signal?: AbortSignal;
  ifMatch?: string | number;
  headers?: Record<string, string>;
};

function withQuery(path: string, query?: RequestOpts['query']) {
  if (!query) return path;
  return query ? `${path}?${query}` : path;
}

async function request<T>(
  method: string,
  path: string,
  opts: RequestOpts = {}
): Promise<T> {
  const url = new URL(withQuery(path, opts.query), BASE_URL).toString();

const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.body && !(opts.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
    ...(opts.ifMatch !== undefined ? { 'If-Match': String(opts.ifMatch) } : {}),
    ...(opts.headers ?? {}),
    ...dynamicHeadersProvider(), // <--- neu
};

  const res = await fetch(url, {
    method,
    headers,
    body:
      opts.body && !(opts.body instanceof FormData)
        ? JSON.stringify(opts.body)
        : (opts.body as BodyInit | undefined),
    credentials: 'omit',
    signal: opts.signal,
  });

  if (!res.ok) {
    // Versuch, Fehlermeldung lesbar zu machen
    let message = res.statusText || 'HTTP Error';
    try {
      const ct = res.headers.get('Content-Type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json();
        message = data?.detail || data?.title || message;
      } else {
        const text = await res.text();
        if (text) message = text;
      }
    } catch {
      /* ignore */
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  // 204/DELETE/kein JSON -> undefined zurückgeben
  const ct = res.headers.get('Content-Type') || '';
  if (
    res.status === 204 ||
    method === 'DELETE' ||
    !ct.includes('application/json')
  ) {
    return undefined as unknown as T;
  }
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, opts?: Omit<RequestOpts, 'body'>) =>
    request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'body'>) =>
    request<T>('POST', path, {
      ...opts,
      body,
    }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOpts, 'body'>) =>
    request<T>('PUT', path, {
      ...opts,
      body,
    }),
  del: <T>(path: string, opts?: Omit<RequestOpts, 'body'>) =>
    request<T>('DELETE', path, opts),
};
