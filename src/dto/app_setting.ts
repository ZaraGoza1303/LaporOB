import z from "zod";

export const UpsertSettingSchema = z.object({
  app_name: z.string().min(1).max(100).nullable().optional(),
  company_name: z.string().max(200).nullable().optional(),
  logo_url: z.string().max(500).nullable().optional(),
});

export type UpsertSettingReq = z.infer<typeof UpsertSettingSchema>;
