import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { obController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const obTugasRouter = Router();
obTugasRouter.use(verifyJWTToken);
obTugasRouter.use(requireRole(USER_ROLE.OB));

obTugasRouter.get("/", (req, res) => obController.getTugas(req, res));
obTugasRouter.patch("/:tugas_id/claim", (req, res) => obController.claimTugas(req, res));
obTugasRouter.patch("/:tugas_id/selesai", (req, res) => obController.completeTugas(req, res));

export default obTugasRouter;
