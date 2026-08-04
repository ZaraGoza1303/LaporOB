import z from "zod";

export const SkillIdParamSchema = z.object({
    skill_id: z.string().trim().uuid({ message: "Format skill_id harus UUID yang valid" }),
});

export const CreateSkillDefinitionSchema = z.object({
    nama_skill: z.string().min(1, { message: "Nama skill wajib diisi" }).max(100, { message: "Maksimal 100 karakter" }),
    keyword: z.array(z.string()).default([]),
    deskripsi: z.string().optional(),
    is_auto: z.boolean().optional().default(true),
    threshold: z.coerce.number().int().min(0).default(5),
});

export const UpdateSkillDefinitionSchema = z.object({
    nama_skill: z.string().min(1).max(100).optional(),
    keyword: z.array(z.string()).optional(),
    deskripsi: z.string().optional().nullable(),
    is_auto: z.boolean().optional(),
    is_active: z.boolean().optional(),
    threshold: z.coerce.number().int().min(0).optional(),
});

export const AssignSkillSchema = z.object({
    ob_id: z.string().trim().uuid({ message: "Format ob_id harus berupa UUID yang valid" }),
    skill_id: z.string().trim().uuid({ message: "Format skill_id harus berupa UUID yang valid" }),
});

export type CreateSkillDefinitionReq = z.infer<typeof CreateSkillDefinitionSchema>;
export type UpdateSkillDefinitionReq = z.infer<typeof UpdateSkillDefinitionSchema>;
export type AssignSkillReq = z.infer<typeof AssignSkillSchema>;


