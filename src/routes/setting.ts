import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { settingController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const settingRouter = Router();
settingRouter.use(verifyJWTToken);
settingRouter.use(requireRole(USER_ROLE.ADMIN));

settingRouter.get("/", (req, res) => settingController.getAll(req, res));
settingRouter.put("/", (req, res) => settingController.upsert(req, res));

export default settingRouter;
