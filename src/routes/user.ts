import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { usersController } from "../container.js";

const userRouter = Router();
userRouter.use(verifyJWTToken);

// Self profile
userRouter.get("/profile", (req, res) => usersController.getProfile(req, res));
userRouter.patch("/profile", (req, res) => usersController.updateProfile(req, res));
userRouter.get("/profile/laporan/:laporan_id",
    requireRole("ob", "karyawan"),
    (req, res) => usersController.getReportDetail(req, res));

export default userRouter;
