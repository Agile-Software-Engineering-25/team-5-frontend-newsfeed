// src/types/newsfeed.ts
export type Content = {
  format: 'markdown' | 'html';
  body: string;
};

export type FeaturedImage = {
  url?: string;
  alt_text?: string;
  caption?: string;
};

export type Author = {
  user_id: string;
  name: string;
  avatar_url?: string | null;
};

export type Expiration = {
  expires_at?: string | null; // ISO
  auto_archive?: boolean | null;
};

export type PrincipalRef = {
  id: string;
  type: 'user' | 'group';
  name: string;
};

export type PermissionsRWX = {
  read?: PrincipalRef[];
  write?: PrincipalRef[];
  delete?: PrincipalRef[];
};

export type PermissionsFlags = {
  update?: boolean;
  delete?: boolean;
};

export type Settings = {
  featured?: boolean;
  sticky?: boolean;
};

export type BlogPostCreate = {
  id: string;
  title: string;
  summary: string;
  status: 'draft' | 'published' | 'archived' | 'deleted';
  content: Content;
  featured_image?: FeaturedImage;
  author: Author;
  creation_date: string; // ISO
  publish_date?: string | null;
  last_modified?: string | null;
  expiration?: Expiration;
  permissions?: PermissionsRWX;
  settings?: Settings;
};

export type BlogPostUpdate = BlogPostCreate;

export type BlogPostRead = {
  id: string;
  version: number;
  title: string;
  summary: string;
  status: 'draft' | 'published' | 'archived' | 'deleted';
  content: Content;
  featured_image?: FeaturedImage;
  author: Author;
  creation_date: string;
  publish_date?: string | null;
  last_modified?: string | null;
  permissions?: PermissionsFlags;
  settings?: Settings;
};

export type BlogPostHistoryItem = {
  id: string;
  version: number;
  title: string;
  slug?: string;
  summary: string;
  status: 'draft' | 'published' | 'archived' | 'deleted';
  content: Content;
  featured_image?: FeaturedImage;
  author: Author;
  creation_date: string;
  publish_date?: string | null;
  last_modified?: string | null;
  permissions?: PermissionsFlags;
  settings?: Settings;
};
