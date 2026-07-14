import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { usersController } from "../container.js";

const profileRouter = Router();
profileRouter.use(verifyJWTToken);

profileRouter.get("/profile", (req, res) => usersController.getProfile(req, res));
profileRouter.patch("/profile", (req, res) => usersController.updateProfile(req, res));
profileRouter.get("/profile/laporan/:laporan_id", requireRole("ob", "karyawan"), (req, res) => usersController.getReportDetail(req, res));

export default profileRouter;
