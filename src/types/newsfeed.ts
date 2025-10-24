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


export interface Author {
  user_id: string; // required
  name: string; // required
  avatar_url?: Nullable<string>; // format: uri, nullable
}

export interface PrincipalRef {
  id: string; // required
  type: PrincipalType; // required
  name: string; // required
}

export type PermissionsList = string[];

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
  content: Content;
  author: Author;
  creation_date: ISODateTime;
  id: string; // required for Create to identify the resource
  permissions?: PermissionsList;
}

// Update = gleiche Struktur wie Create
export type NewsPostUpdate = NewsPostCreate;

export type NewsPostRead = NewsPostCreate;

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
