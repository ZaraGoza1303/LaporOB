import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { kolaborasiController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const obKolaborasiRouter = Router();
obKolaborasiRouter.use(verifyJWTToken);
obKolaborasiRouter.use(requireRole(USER_ROLE.OB));

obKolaborasiRouter.get("/laporan/:laporan_id/gabung", (req, res) => kolaborasiController.daftarRequest(req, res));
obKolaborasiRouter.post("/laporan/:laporan_id/gabung", (req, res) => kolaborasiController.gabung(req, res));
obKolaborasiRouter.patch("/laporan/:laporan_id/gabung/:kolaborasi_id/setujui", (req, res) => kolaborasiController.setujui(req, res));
obKolaborasiRouter.patch("/laporan/:laporan_id/gabung/:kolaborasi_id/tolak", (req, res) => kolaborasiController.tolak(req, res));
obKolaborasiRouter.post("/laporan/:laporan_id/gabung/keluar", (req, res) => kolaborasiController.keluar(req, res));
obKolaborasiRouter.patch("/laporan/:laporan_id/gabung/:kolaborasi_id/keluarkan", (req, res) => kolaborasiController.keluarkan(req, res));

export default obKolaborasiRouter;
