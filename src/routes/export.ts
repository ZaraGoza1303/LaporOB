import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { adminController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const exportRouter = Router();
exportRouter.use(verifyJWTToken);
exportRouter.use(requireRole(USER_ROLE.HR, USER_ROLE.ADMIN));

exportRouter.get("/performance", (req, res) => adminController.exportObPerformanceExcel(req, res));

export default exportRouter;
