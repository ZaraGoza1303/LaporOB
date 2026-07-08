import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { AdminRepository } from "../repositories/admin_repository.js";
import { ObRepository } from "../repositories/ob_repository.js";
import { AdminService } from "../services/admin_service.js";
import { AdminController } from "../controllers/admin_controller.js";
import type { Request, Response } from "express";

const adminRouter = Router();
const db = new PrismaClient();
const obRepository = new ObRepository(db);
const adminRepository = new AdminRepository(db);
const adminService = new AdminService(adminRepository, obRepository);
const adminController = new AdminController(adminService);

adminRouter.use(verifyJWTToken);
adminRouter.use(requireRole("admin"));

// Dashboard
adminRouter.get("/dashboard", (req, res) => adminController.getDashboardData(req, res));
adminRouter.get("/user-stats", (req, res) => adminController.getUserStats(req, res));

// Laporan
adminRouter.get("/laporan", (req, res) => adminController.getAllLaporan(req, res));
adminRouter.get("/laporan/:laporan_id", (req, res) => adminController.getReportDetail(req, res));

export default adminRouter;
