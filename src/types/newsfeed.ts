export type ISODateTime = string;
export type Nullable<T> = T | null;

// ----- Enums / Literal Unions -----
export type PostStatus = 'draft' | 'published' | 'archived' | 'deleted';
export type ContentFormat = 'markdown' | 'html';
export type PrincipalType = 'user' | 'group';

// ----- Core Schemas -----
export interface Content {
  format: ContentFormat; // required
  body: string; // required
}

export interface FeaturedImage {
  url?: string; // format: uri
  alt_text?: string;
  caption?: string;
}

export interface Author {
  user_id: string; // required
  name: string; // required
  avatar_url?: Nullable<string>; // format: uri, nullable
}

export interface Expiration {
  expires_at?: Nullable<ISODateTime>; // nullable
  auto_archive?: Nullable<boolean>; // nullable
}

export interface PrincipalRef {
  id: string; // required
  type: PrincipalType; // required
  name: string; // required
}

export interface PermissionsRWX {
  read?: PrincipalRef[];
  write?: PrincipalRef[];
  delete?: PrincipalRef[];
}

export interface PermissionsFlags {
  update?: boolean;
  delete?: boolean;
}

export interface Settings {
  featured?: boolean;
  sticky?: boolean;
}

// ----- Entity Schemas -----
export interface NewsPostCreate {
  // required
  title: string;
  summary: string;
  status: PostStatus;
  content: Content;
  author: Author;
  creation_date: ISODateTime;

  // optional
  id: string; // required for Create to identify the resource
  featured_image?: FeaturedImage;
  publish_date?: Nullable<ISODateTime>; // nullable
  last_modified?: Nullable<ISODateTime>; // nullable
  expiration?: Expiration;
  permissions?: PermissionsRWX;
  settings?: Settings;
}

// Update = gleiche Struktur wie Create
export type NewsPostUpdate = NewsPostCreate;

export interface NewsPostRead {
  // required
  id: string;
  version: number;
  title: string;
  summary: string;
  status: PostStatus;
  content: Content;
  author: Author;
  creation_date: ISODateTime;

  // optional
  featured_image?: FeaturedImage;
  publish_date?: Nullable<ISODateTime>; // nullable
  last_modified?: Nullable<ISODateTime>; // nullable
  permissions?: PermissionsFlags;
  settings?: Settings;
}

export interface NewsPostHistoryItem {
  // required
  id: string;
  version: number;
  title: string;
  summary: string;
  status: PostStatus;
  content: Content;
  author: Author;
  creation_date: ISODateTime;

  // optional
  slug?: string;
  featured_image?: FeaturedImage;
  publish_date?: Nullable<ISODateTime>; // nullable
  last_modified?: Nullable<ISODateTime>; // nullable
  permissions?: PermissionsFlags;
  settings?: Settings;
}

// ----- (Optional) Helper Types for API usage -----

// GET /newsfeed response
export type NewsPostListResponse = NewsPostRead[];

// GET /newsfeed/{id}/history response
export type NewsPostHistoryResponse = NewsPostHistoryItem[];

// POST /newsfeed request body
export type CreateNewsPostRequest = NewsPostCreate;

// PUT /newsfeed/{id} request body
export type UpdateNewsPostRequest = NewsPostUpdate;
