import { z } from 'zod';

export const RuanganIdParamSchema = z.object({
  ruangan_id: z.string().trim().uuid({ message: "Format ruangan_id harus UUID yang valid" }),
});

export const RuanganQuerySchema = z.object({
  lantai_id: z.string().trim().uuid({ message: "Format lantai_id wajib berupa UUID yang valid" }).optional(),
});

export const CreateRuanganSchema = z.object({
  lantai_id: z.string().uuid({ message: "Format Lantai ID harus berupa UUID yang valid" }),
  nama: z.string().trim().min(1, { message: "Nama ruangan tidak boleh kosong" }),
});

export const UpdateRuanganSchema = z.object({
  nama: z.string().trim().min(1, { message: "Nama ruangan tidak boleh kosong" }),
});

export type CreateRuanganReq = z.infer<typeof CreateRuanganSchema>;
export type UpdateRuanganReq = z.infer<typeof UpdateRuanganSchema>;
