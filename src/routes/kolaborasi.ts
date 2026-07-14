import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { kolaborasiController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const kolaborasiRouter = Router();
kolaborasiRouter.use(verifyJWTToken);
kolaborasiRouter.use(requireRole(USER_ROLE.OB));

kolaborasiRouter.get("/laporan/:laporan_id/gabung", (req, res) => kolaborasiController.daftarRequest(req, res));
kolaborasiRouter.post("/laporan/:laporan_id/gabung", (req, res) => kolaborasiController.gabung(req, res));
kolaborasiRouter.patch("/laporan/:laporan_id/gabung/:kolaborasi_id/setujui", (req, res) => kolaborasiController.setujui(req, res));
kolaborasiRouter.patch("/laporan/:laporan_id/gabung/:kolaborasi_id/tolak", (req, res) => kolaborasiController.tolak(req, res));

export default kolaborasiRouter;
