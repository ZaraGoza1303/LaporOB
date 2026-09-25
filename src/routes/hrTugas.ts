import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { tugasController, adminController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const hrTugasRouter = Router();
hrTugasRouter.use(verifyJWTToken);
hrTugasRouter.use(requireRole(USER_ROLE.HR, USER_ROLE.ADMIN));

hrTugasRouter.get("/tugas", (req, res) => tugasController.getAll(req, res));
hrTugasRouter.get("/tugas-combination", (req, res) => adminController.getListPekerjaan(req, res));
hrTugasRouter.get("/tugas/stats", (req, res) => adminController.getStatsTugas(req, res));
hrTugasRouter.get("/tugas/approval-list", (req, res) => adminController.getApprovalListTugas(req, res));
hrTugasRouter.get("/tugas/:tugas_id", (req, res) => tugasController.getByID(req, res));
hrTugasRouter.post("/tugas", (req, res) => tugasController.create(req, res));
hrTugasRouter.patch("/tugas/:tugas_id", (req, res) => tugasController.update(req, res));
hrTugasRouter.delete("/tugas/:tugas_id", (req, res) => tugasController.delete(req, res));

export default hrTugasRouter;
