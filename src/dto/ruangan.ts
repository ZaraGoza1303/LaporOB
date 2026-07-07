import { z } from 'zod';

export const CreateRuanganSchema = z.object({
  lantai_id: z.string().uuid({ message: "Format Lantai ID harus berupa UUID yang valid" }),
  nama: z.string({ message: "Nama ruangan harus berupa string" }),
});

export const UpdateRuanganSchema = z.object({
  nama: z.string({ message: "Nama ruangan harus berupa string" }),
});

export type CreateRuanganReq = z.infer<typeof CreateRuanganSchema>;
export type UpdateRuanganReq = z.infer<typeof UpdateRuanganSchema>;
