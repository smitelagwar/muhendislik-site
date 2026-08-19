// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — TİP TANIMLARI
// ============================================================================

export interface DokFolder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DokFile {
  id: string;
  folder_id: string | null;
  display_name: string;
  blob_pathname: string;
  blob_url: string;
  size_bytes: string | number;
  mime_type: string;
  extension: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DokShareLink {
  id: string;
  token_hash: string;
  title: string | null;
  expires_at: string;
  password_hash: string | null;
  max_downloads: number | null;
  download_count: number;
  created_at: string;
  revoked_at: string | null;
  last_accessed_at: string | null;
  url_token_encrypted?: string | null;
}

export interface DokShareItem {
  id: string;
  share_link_id: string;
  file_id: string;
  snapshot_name: string;
  relative_path: string;
  snapshot_size_bytes: string | number;
  snapshot_mime_type: string;
  sort_order: number;
}

export interface DokSessionPayload {
  username: string;
  sessionVersion: number;
  jti: string;
  iat: number;
  exp: number;
}

export interface DokBreadcrumbItem {
  id: string | null; // null for root
  name: string;
}

export interface DokTrashItem {
  id: string;
  type: "file" | "folder";
  name: string;
  size_bytes?: number;
  deleted_at: string;
  original_folder_name?: string | null;
}
