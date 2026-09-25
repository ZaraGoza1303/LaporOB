import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { usersController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const hrUsersRouter = Router();
hrUsersRouter.use(verifyJWTToken);
hrUsersRouter.use(requireRole(USER_ROLE.HR, USER_ROLE.ADMIN));

hrUsersRouter.get("/users", (req, res) => usersController.getAll(req, res));
hrUsersRouter.get("/users/ob", (req, res) => usersController.getAllOb(req, res));
hrUsersRouter.get("/users/karyawan", (req, res) => usersController.getAllKaryawan(req, res));
hrUsersRouter.get("/user/:user_id", (req, res) => usersController.getByID(req, res));

export default hrUsersRouter;
