// src/pages/Newsfeed.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import NewsPostCard from '@components/Newspost/Newspost';
import FilterBar, {
  type FilterState,
  buildQuery,
} from '../../components/FilterBar/FilterBar.tsx';

import useNewsfeed from '@/services/useNewsfeed'; // <- neu

import type {
  NewsPostCreate,
  NewsPostRead,
  NewsPostUpdate,
} from '@/types/newsfeed';

import useUser from '@/hooks/useUser';

const Newsfeed: React.FC = () => {
  const [posts, setPosts] = useState<NewsPostRead[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    datePreset: 'all',
    from: undefined,
    to: undefined,
    page: 1,
    pageSize: 10,
  });

  // Query-String aus der FilterBar -> wird 1:1 an die API gegeben
  const filterQuery = useMemo(() => buildQuery(filters), [filters]);
  //const filterQuery = undefined; // für den Anfang: kein Filter

  //user Data
  const user = useUser();
  const token = user.getAccessToken();

  const { listPosts, createPost, updatePost, deletePost } = useNewsfeed();

  // Backend-Load (ohne Frontend-Filterung)
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await listPosts({
          filter: filterQuery || undefined,
          signal: ac.signal,
        });
        setPosts(result.reverse());
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [filterQuery, token]);

  // Create / Update / Delete via API
  const handleCreate = useCallback(
    async ({ post }: { post: NewsPostCreate }) => {
      try {
        const created = await createPost(post);
        // Optional: direkt oben einfügen – oder einfach Reload durch Filteränderung triggern
        setPosts((prev) => [created, ...prev]);
      } catch (e) {
        alert((e as Error).message);
      }
    },
    []
  );

  const handleUpdate = useCallback(
    async ({ post }: { post: NewsPostUpdate }) => {
      try {
        const updated = await updatePost(post.id, post);
        setPosts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
      } catch (e) {
        alert((e as Error).message);
      }
    },
    [posts]
  );

  const handleRemove = useCallback(async ({ id }: { id: string }) => {
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  }, []);

  const handleChange = () => {
    // no-op: aktuell nicht benötigt
  };

  // Draft für neuen Post (Create erfordert id laut Schema)
  const newPostDraft: NewsPostCreate = {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `tmp-${Date.now()}`,
    title: '',
    content: { format: 'html', body: '' },
    author: { user_id: user.getUserId(), name: user.getFullName() },
    creation_date: new Date().toISOString(),
      permissions: ["sau-admin", "university-administrative-staff"]

  };

  return (
    <div>
      <FilterBar
        initial={filters}
        onChange={setFilters}
        pageSizeOptions={[10, 20, 50]}
      />
      {loading && <div>Wird geladen…</div>}
      {error && <div style={{ color: 'crimson' }}>Fehler: {error}</div>}

      <div>sau-admin: {user.hasRole("sau-admin")}</div>
      <div>admin: {user.hasRole("admin")}</div>


      {user.hasRole("admin") && (
        <NewsPostCard
          post={newPostDraft}
          postViewProp="add"
          maintain={true}
          onChange={handleChange}
          onSave={handleCreate}
          onCancel={() => undefined}
        />
      )}

      {/* Keine Frontend-Filterung/Pagination: genau das rendern, was vom Backend kommt */}
      {posts.map((p) => (
        <NewsPostCard
          key={p.id}
          post={p}
          maintain={user.hasRole("sau-admin")}
          onChange={handleChange}
          onSave={handleUpdate}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
};

export default Newsfeed;
