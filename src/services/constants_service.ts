import type { AppConstantsRes } from "../dto/constants.js";
import {
    HARI,
    CHECKLIST_STATUS,
    TUGAS_STATUS,
    LAPORAN_STATUS,
    LAPORAN_PRIORITY,
    KOLABORASI_STATUS,
    USER_ROLE,
    REF_TIPE,
} from "../utils/constants.js";
import type { IConstantsService } from "./constants_service.interface.js";

export class ConstantsService implements IConstantsService {
    getConstants(): AppConstantsRes {
        return {
            hari: [...HARI],
            checklist_status: Object.values(CHECKLIST_STATUS),
            tugas_status: Object.values(TUGAS_STATUS),
            laporan_status: Object.values(LAPORAN_STATUS),
            laporan_priority: Object.values(LAPORAN_PRIORITY),
            kolaborasi_status: Object.values(KOLABORASI_STATUS),
            user_role: Object.values(USER_ROLE),
            ref_tipe: Object.values(REF_TIPE),
        };
    }
}
