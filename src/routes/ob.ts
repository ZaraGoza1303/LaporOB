import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { obController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const obRouter = Router();
obRouter.use(verifyJWTToken);
obRouter.use(requireRole(USER_ROLE.OB));

obRouter.get("/dashboard", (req, res) => obController.getHomeStats(req, res));
obRouter.get("/tugas", (req, res) => obController.getTugas(req, res));
obRouter.patch("/laporan/:laporan_id", (req, res) => obController.takeLapor(req, res));
obRouter.post("/laporan/:laporan_id", (req, res) => obController.submitHistori(req, res));
obRouter.post("/laporan/:laporan_id/batalkan", (req, res) => obController.batalkanLapor(req, res));
obRouter.patch("/laporan/:laporan_id/kolaborasi", (req, res) => obController.toggleKolaborasi(req, res));
obRouter.patch("/checklist/:checklist_id/claim", (req, res) => obController.claimChecklist(req, res));
obRouter.get("/riwayat", (req, res) => obController.getRiwayat(req, res));
obRouter.get("/riwayat/:laporan_id", (req, res) => obController.getDetailRiwayat(req, res));
obRouter.get("/profile", (req, res) => obController.getProfile(req, res));
obRouter.patch("/tugas/:tugas_id/claim", (req, res) => obController.claimTugas(req, res));
obRouter.patch("/tugas/:tugas_id/selesai", (req, res) => obController.completeTugas(req, res));

export default obRouter;
