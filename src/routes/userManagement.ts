import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { usersController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const adminUserManagementRouter = Router();
adminUserManagementRouter.use(verifyJWTToken);
adminUserManagementRouter.use(requireRole(USER_ROLE.ADMIN));

// user crud
adminUserManagementRouter.get("/users", (req, res) => usersController.getAll(req, res));
adminUserManagementRouter.post("/user", (req, res) => usersController.create(req, res));

// ob
adminUserManagementRouter.get("/user/all-ob", (req, res) => usersController.getAllOb(req, res));
adminUserManagementRouter.get("/user/all-karyawan", (req, res) => usersController.getAllKaryawan(req, res));
adminUserManagementRouter.get("/user/:user_id/performance/ob", (req, res) => usersController.getObPerformanceStats(req, res));
adminUserManagementRouter.get("/user/:user_id/performance/karyawan", (req, res) => usersController.getKarywanPerformanceStats(req, res));

adminUserManagementRouter.get("/user/:user_id", (req, res) => usersController.getByID(req, res));
adminUserManagementRouter.patch("/user/:user_id", (req, res) => usersController.update(req, res));
adminUserManagementRouter.post("/user/:user_id/renew-token", (req, res) => usersController.renewActivationToken(req, res));
adminUserManagementRouter.delete("/user/:user_id", (req, res) => usersController.delete(req, res));

export default adminUserManagementRouter;
