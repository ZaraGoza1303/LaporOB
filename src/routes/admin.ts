import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { AdminRepository } from "../repositories/admin_repository.js";
import { AdminService } from "../services/admin_service.js";
import { AdminController } from "../controllers/admin_controller.js";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { StorageServiceFactory } from "../services/storage_service.factory.js";

const adminRouter = Router();

const db = new PrismaClient();
const adminRepo = new AdminRepository(db);
const adminService = new AdminService(adminRepo);
const storageService = StorageServiceFactory.getProvider();
const adminController = new AdminController(adminService, storageService);

adminRouter.use(verifyJWTToken);
adminRouter.use(requireRole("admin"));

adminRouter.get("/", (req, res) => adminController.getAll(req, res));
adminRouter.get("/user-stats", (req, res) => adminController.getUserStats(req, res));
adminRouter.get("/:user_id", (req, res) => adminController.getByID(req, res));
adminRouter.post("/", (req, res) => adminController.create(req, res));
adminRouter.patch("/:user_id", (req, res) => adminController.update(req, res));
adminRouter.delete("/:user_id", (req, res) => adminController.delete(req, res));

export default adminRouter;
