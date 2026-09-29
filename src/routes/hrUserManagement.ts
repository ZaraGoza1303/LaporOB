import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { adminController, usersController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const hrUserManagementRouter = Router();
hrUserManagementRouter.use(verifyJWTToken);
hrUserManagementRouter.use(requireRole(USER_ROLE.HR, USER_ROLE.ADMIN));

// user crud
hrUserManagementRouter.post("/user", (req, res) => usersController.create(req, res));
hrUserManagementRouter.patch("/user/:user_id", (req, res) => usersController.update(req, res));
hrUserManagementRouter.post("/user/:user_id/renew-token", (req, res) => usersController.renewActivationToken(req, res));
hrUserManagementRouter.delete("/user/:user_id", (req, res) => usersController.delete(req, res));

// penugasan OB (logic sama dengan /api/admin, beda pengecekan role saja)
hrUserManagementRouter.post("/user/assign-locations", (req, res) => adminController.assignObToLocations(req, res));
hrUserManagementRouter.get("/user/assignments", (req, res) => adminController.getPenugasanByPeriode(req, res));

// performance
hrUserManagementRouter.get("/user/:user_id/performance/ob", (req, res) => usersController.getObPerformanceStats(req, res));
hrUserManagementRouter.get("/user/:user_id/performance/karyawan", (req, res) => usersController.getKarywanPerformanceStats(req, res));

export default hrUserManagementRouter;
