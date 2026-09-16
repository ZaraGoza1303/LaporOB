import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { karyawanController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const karyawanRouter = Router();
karyawanRouter.use(verifyJWTToken);

karyawanRouter.get("/dashboard", requireRole(USER_ROLE.KARYAWAN), (req, res) => karyawanController.getHomeStats(req, res));
karyawanRouter.post("/laporan", requireRole(USER_ROLE.KARYAWAN, USER_ROLE.HR), (req, res) => karyawanController.createReport(req, res));

export default karyawanRouter;
