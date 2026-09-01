import type { AppConstantsRes } from "../types/constants.js";

export interface IConstantsService {
    getConstants(): AppConstantsRes;
}
