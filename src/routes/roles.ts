import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { usersController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const rolesRouter = Router();
rolesRouter.use(verifyJWTToken);
rolesRouter.use(requireRole(USER_ROLE.ADMIN, USER_ROLE.HR));

rolesRouter.get("/", (req, res) => usersController.getRoles(req, res));

export default rolesRouter;
