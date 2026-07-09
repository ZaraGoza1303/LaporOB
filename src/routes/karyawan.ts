import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { karyawanController } from "../container.js";

const karyawanRouter = Router();
karyawanRouter.use(verifyJWTToken);
karyawanRouter.use(requireRole("karyawan"));

karyawanRouter.get("/dashboard", (req, res) => karyawanController.getHomeStats(req, res));
karyawanRouter.post("/laporan", (req, res) => karyawanController.createReport(req, res));

export default karyawanRouter;
