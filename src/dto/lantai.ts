import { z } from 'zod';

export const LantaiIdParamSchema = z.object({
  lantai_id: z.string().trim().uuid({ message: "Format lantai_id harus UUID yang valid" }),
});

export const LantaiQuerySchema = z.object({
  lokasi_id: z.string().trim().uuid({ message: "Format lokasi_id wajib berupa UUID yang valid" }),
});

export const CreateLantaiSchema = z.object({
  lokasi_id: z.string().uuid({ message: "Format Lokasi ID harus berupa UUID yang valid" }),
  nomor_lantai: z.number().int({ message: "Nomor lantai harus berupa bilangan bulat" }),
});

export const UpdateLantaiSchema = z.object({
  nomor_lantai: z.number().int(),
});

export type CreateLantaiReq = z.infer<typeof CreateLantaiSchema>;
export type UpdateLantaiReq = z.infer<typeof UpdateLantaiSchema>;