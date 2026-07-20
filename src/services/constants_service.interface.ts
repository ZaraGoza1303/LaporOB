import type { AppConstantsRes } from "../dto/constants.js";

export interface IConstantsService {
    getConstants(): AppConstantsRes;
}
