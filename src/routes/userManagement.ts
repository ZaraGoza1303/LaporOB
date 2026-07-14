import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { usersController } from "../container.js";

const adminUserManagementRouter = Router();
adminUserManagementRouter.use(verifyJWTToken);
adminUserManagementRouter.use(requireRole("admin"));

// user crud
adminUserManagementRouter.get("/user", (req, res) => usersController.getAll(req, res));
adminUserManagementRouter.post("/user", (req, res) => usersController.create(req, res));

// ob
adminUserManagementRouter.get("/user/all-ob", (req, res) => usersController.getAllOb(req, res));
adminUserManagementRouter.get("/user/all-karyawan", (req, res) => usersController.getAllKaryawan(req, res));
adminUserManagementRouter.get("/user/:user_id/performance", (req, res) => usersController.getObPerformanceStats(req, res));

adminUserManagementRouter.get("/user/:user_id", (req, res) => usersController.getByID(req, res));
adminUserManagementRouter.patch("/user/:user_id", (req, res) => usersController.update(req, res));
adminUserManagementRouter.delete("/user/:user_id", (req, res) => usersController.delete(req, res));

export default adminUserManagementRouter;
