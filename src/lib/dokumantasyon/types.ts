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
  starred_at?: string | null;
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
  starred_at?: string | null;
  last_opened_at?: string | null;
  current_version_number?: number;
}

export interface DokFileVersion {
  id: string;
  file_id: string;
  version_number: number;
  blob_pathname: string;
  blob_url: string;
  size_bytes: string | number;
  mime_type: string;
  sha256_hash?: string | null;
  comment?: string | null;
  created_by: string;
  created_at: string;
}

export interface DokActivityEvent {
  id: string;
  action: "upload" | "rename" | "move" | "trash" | "restore" | "share_create" | "share_revoke";
  item_type: "file" | "folder" | "share";
  item_id: string | null;
  display_name: string | null;
  created_at: string;
}

export interface DokCadDerivative {
  id: string;
  file_id: string;
  source_version_key: string;
  source_sha256: string | null;
  aps_urn: string | null;
  aps_object_key: string | null;
  status: "pending" | "uploading" | "translating" | "ready" | "failed";
  error_code: string | null;
  error_message: string | null;
  lock_expires_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DokDwgDxfDerivative {
  id: string;
  file_id: string;
  source_version_key: string;
  source_sha256: string;
  converter_signature: string;
  dwg_version: string | null;
  status: "pending" | "converting" | "validating" | "ready" | "failed";
  validation_decision: "PASS" | "WARN" | "REJECT" | null;
  dxf_blob_pathname: string | null;
  dxf_blob_url: string | null;
  dxf_sha256: string | null;
  dxf_size_bytes: string | number | null;
  conversion_ms: number | null;
  validation_ms: number | null;
  diagnostics_json: unknown;
  validation_json: unknown;
  error_code: string | null;
  error_message: string | null;
  lock_expires_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
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
  file_version_id?: string | null;
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