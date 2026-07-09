import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { obController } from "../container.js";

const obRouter = Router();
obRouter.use(verifyJWTToken);
obRouter.use(requireRole("ob"));

obRouter.get("/dashboard", (req, res) => obController.getHomeStats(req, res));
obRouter.patch("/laporan/:laporan_id", (req, res) => obController.takeLapor(req, res));
obRouter.post("/laporan/:laporan_id/histori", (req, res) => obController.submitHistori(req, res));
obRouter.post("/laporan/:laporan_id/tolak", (req, res) => obController.rejectLapor(req, res));

export default obRouter;
