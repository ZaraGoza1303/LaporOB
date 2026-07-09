import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { adminController, usersController } from "../container.js";

const adminRouter = Router();
adminRouter.use(verifyJWTToken);
adminRouter.use(requireRole("admin"));

// User CRUD
adminRouter.get("/user", (req, res) => usersController.getAll(req, res));
adminRouter.get("/user/:user_id", (req, res) => usersController.getByID(req, res));
adminRouter.post("/user", (req, res) => usersController.create(req, res));
adminRouter.patch("/user/:user_id", (req, res) => usersController.update(req, res));
adminRouter.delete("/user/:user_id", (req, res) => usersController.delete(req, res));

// Dashboard
adminRouter.get("/dashboard", (req, res) => adminController.getDashboardData(req, res));
adminRouter.get("/user-stats", (req, res) => adminController.getUserStats(req, res));

// Laporan
adminRouter.get("/laporan", (req, res) => adminController.getAllLaporan(req, res));
adminRouter.get("/laporan/:laporan_id", (req, res) => adminController.getReportDetail(req, res));

export default adminRouter;
