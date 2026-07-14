import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { obController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const obRouter = Router();
obRouter.use(verifyJWTToken);
obRouter.use(requireRole(USER_ROLE.OB));

obRouter.get("/dashboard", (req, res) => obController.getHomeStats(req, res));
obRouter.patch("/laporan/:laporan_id", (req, res) => obController.takeLapor(req, res));
obRouter.post("/laporan/:laporan_id", (req, res) => obController.submitHistori(req, res));
obRouter.post("/laporan/:laporan_id/tolak", (req, res) => obController.rejectLapor(req, res));
obRouter.patch("/checklist/:checklist_id/claim", (req, res) => obController.claimChecklist(req, res));

export default obRouter;
