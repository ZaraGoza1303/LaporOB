import z from "zod";

// Logo hanya boleh URL http(s) absolut atau path lokal di /uploads/...
// Selain itu (javascript:, data:, path relatif, string kosong) ditolak.
const LOGO_URL_PATTERN = /^(https?:\/\/\S+|\/?uploads\/\S+)$/i;

const isValidLogoUrl = (val: string): boolean =>
  !val.includes("..") && LOGO_URL_PATTERN.test(val);

const logoUrlSchema = z
  .string()
  .max(500, { message: "URL logo maksimal 500 karakter" })
  .refine(isValidLogoUrl, {
    message: "URL logo harus berupa URL http(s) absolut atau path file di uploads/",
  });

export const UpsertSettingSchema = z.object({
  app_name: z.string().min(1).max(100).nullable().optional(),
  company_name: z.string().max(200).nullable().optional(),
  logo_url: logoUrlSchema.nullable().optional(),
});

export type UpsertSettingReq = z.infer<typeof UpsertSettingSchema>;
