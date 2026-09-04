// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GİRDİ DOĞRULAMA ŞEMALARI (ZOD)
// ============================================================================

import { z } from "zod";

export const safeFileNameSchema = z
  .string()
  .trim()
  .min(1, "Dosya adı boş bırakılamaz.")
  .max(255, "Dosya adı en fazla 255 karakter olabilir.")
  .refine((value) => value !== "." && value !== "..", "Dosya adı geçersiz.")
  .refine(
    (value) => !/[\\/:*?"<>|\u0000-\u001F\u007F]/.test(value),
    "Dosya adı yol, kontrol veya sistem karakteri içeremez."
  );

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Kullanıcı adı boş bırakılamaz."),
  password: z.string().min(1, "Şifre boş bırakılamaz."),
});

export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Klasör adı boş bırakılamaz.")
    .max(255, "Klasör adı en fazla 255 karakter olabilir.")
    .refine((val) => !/[\\/:*?"<>|]/.test(val), "Klasör adı geçersiz karakterler içeremez."),
  parentId: z.string().uuid("Geçersiz üst klasör kimliği.").nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Klasör adı boş bırakılamaz.")
    .max(255, "Klasör adı en fazla 255 karakter olabilir.")
    .refine((val) => !/[\\/:*?"<>|]/.test(val), "Klasör adı geçersiz karakterler içeremez.")
    .optional(),
  parentId: z.string().uuid("Geçersiz üst klasör kimliği.").nullable().optional(),
  starred: z.boolean().optional(),
});

export const updateFileSchema = z.object({
  displayName: safeFileNameSchema.optional(),
  folderId: z.string().uuid("Geçersiz klasör kimliği.").nullable().optional(),
  starred: z.boolean().optional(),
});

export const uploadIntentSchema = z.object({
  filename: safeFileNameSchema,
  size: z.number().finite().positive("Geçersiz dosya boyutu."),
  mimeType: z.string().trim().max(255).optional(),
  folderId: z.string().uuid("Geçersiz klasör kimliği.").nullable().optional(),
});

export const legacyStarMigrationSchema = z.object({
  ids: z.array(z.string().uuid("Geçersiz yıldızlı öğe kimliği.")).max(500),
});

export const createShareSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid("Geçersiz öğe kimliği."),
        type: z.enum(["file", "folder"]),
      })
    )
    .min(1, "En az bir dosya veya klasör seçmelisiniz."),
  duration: z.enum(["1_DAY", "3_DAYS", "1_WEEK", "1_MONTH", "CUSTOM"]),
  customExpiresAt: z.string().datetime().optional(),
  title: z.string().trim().max(255).optional().nullable(),
  password: z.string().min(4, "Paylaşım şifresi en az 4 karakter olmalıdır.").optional().nullable(),
  maxDownloads: z.number().int().min(1).max(10000).optional().nullable(),
});

export const unlockShareSchema = z.object({
  password: z.string().min(1, "Şifre girilmelidir."),
});

export const bulkItemSchema = z.object({
  id: z.string().uuid("Geçersiz öğe kimliği."),
  type: z.enum(["file", "folder"]),
});

export const bulkTrashSchema = z.object({
  items: z.array(bulkItemSchema).min(1, "En az bir öğe belirtilmelidir.").max(250, "Maksimum 250 öğe işlenebilir."),
});

export const bulkMoveSchema = z.object({
  items: z.array(bulkItemSchema).min(1, "En az bir öğe belirtilmelidir.").max(250, "Maksimum 250 öğe işlenebilir."),
  targetFolderId: z.string().uuid("Geçersiz hedef klasör kimliği.").nullable(),
});

export const bulkStarSchema = z.object({
  items: z.array(bulkItemSchema).min(1, "En az bir öğe belirtilmelidir.").max(250, "Maksimum 250 öğe işlenebilir."),
  starred: z.boolean(),
});

export const bulkRestoreSchema = z.object({
  items: z.array(bulkItemSchema).min(1, "En az bir öğe belirtilmelidir.").max(250, "Maksimum 250 öğe işlenebilir."),
});

