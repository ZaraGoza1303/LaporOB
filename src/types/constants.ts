import type { HariType } from "../utils/constants.js";

export interface AppConstantsRes {
    hari: HariType[];
    checklist_status: string[];
    tugas_status: string[];
    laporan_status: string[];
    laporan_priority: string[];
    kolaborasi_status: string[];
    user_role: string[];
    ref_tipe: string[];
}
