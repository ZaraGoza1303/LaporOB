import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { obController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const obLaporanRouter = Router();
obLaporanRouter.use(verifyJWTToken);
obLaporanRouter.use(requireRole(USER_ROLE.OB));

obLaporanRouter.get("/:laporan_id", (req, res) => obController.getReportDetail(req, res));
obLaporanRouter.patch("/:laporan_id", (req, res) => obController.takeLapor(req, res));
obLaporanRouter.post("/:laporan_id", (req, res) => obController.submitHistori(req, res));
obLaporanRouter.post("/:laporan_id/batalkan", (req, res) => obController.batalkanLapor(req, res));
obLaporanRouter.patch("/:laporan_id/kolaborasi", (req, res) => obController.toggleKolaborasi(req, res));
obLaporanRouter.patch("/checklist/:checklist_id/claim", (req, res) => obController.claimChecklist(req, res));

export default obLaporanRouter;
