import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { obController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const obRouter = Router();
obRouter.use(verifyJWTToken);
obRouter.use(requireRole(USER_ROLE.OB));

obRouter.get("/dashboard", (req, res) => obController.getHomeStats(req, res));

export default obRouter;
