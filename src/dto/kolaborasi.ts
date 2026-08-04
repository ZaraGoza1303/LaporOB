import { z } from "zod";

export const LaporanIdParams = z.object({
    laporan_id: z.string().uuid(),
});

export const KolaborasiIdParams = z.object({
    kolaborasi_id: z.string().uuid(),
    laporan_id: z.string().uuid(),
});

export type LaporanIdParams = z.infer<typeof LaporanIdParams>;
export type KolaborasiIdParams = z.infer<typeof KolaborasiIdParams>;

