// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GİRDİ DOĞRULAMA ŞEMALARI (ZOD)
// ============================================================================

import { z } from "zod";

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
});

export const updateFileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Dosya adı boş bırakılamaz.")
    .max(255, "Dosya adı en fazla 255 karakter olabilir.")
    .refine((val) => !/[\\/:*?"<>|]/.test(val), "Dosya adı geçersiz karakterler içeremez.")
    .optional(),
  folderId: z.string().uuid("Geçersiz klasör kimliği.").nullable().optional(),
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
