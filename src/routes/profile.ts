import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { usersController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const profileRouter = Router();
profileRouter.use(verifyJWTToken);

profileRouter.get("/profile", (req, res) => usersController.getProfile(req, res));
profileRouter.patch("/profile", (req, res) => usersController.updateProfile(req, res));
profileRouter.get("/profile/laporan/:laporan_id", requireRole(USER_ROLE.OB, USER_ROLE.KARYAWAN), (req, res) => usersController.getReportDetail(req, res));

export default profileRouter;
