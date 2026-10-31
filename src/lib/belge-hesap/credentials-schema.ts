import { z } from "zod";
export const usernameSchema = z.string().trim().min(2).max(32).regex(/^[a-zA-Z0-9_.-]+$/, "Kullanıcı adı harf, rakam, nokta, tire veya alt çizgi içermeli.");
export const credentialsSchema = z.object({
  username: usernameSchema,
  password: z.string().min(3).max(128),
}).strict();
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(3).max(128),
  newPassword: z.string().min(3).max(128),
}).strict();
export const deletionSchema = z.object({
  password: z.string().min(3).max(128),
  confirmation: z.literal("SIL"),
}).strict();
export const adminTargetSchema = z.object({ userId: z.string().uuid() }).strict();

