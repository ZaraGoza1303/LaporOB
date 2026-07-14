import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { karyawanController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const karyawanRouter = Router();
karyawanRouter.use(verifyJWTToken);
karyawanRouter.use(requireRole(USER_ROLE.KARYAWAN));

karyawanRouter.get("/dashboard", (req, res) => karyawanController.getHomeStats(req, res));
karyawanRouter.post("/laporan", (req, res) => karyawanController.createReport(req, res));

export default karyawanRouter;
