import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { ObRepository } from "../repositories/ob_repository.js";
import { ObService } from "../services/ob_service.js";
import { ObController } from "../controllers/ob_controller.js";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";

const obRouter = Router();

const db = new PrismaClient();
const obRepo = new ObRepository(db);
const obService = new ObService(obRepo);
const obController = new ObController(obService);

obRouter.use(verifyJWTToken);
obRouter.use(requireRole("ob"));

obRouter.get("/dashboard", (req, res) => obController.getHomeStats(req, res));

export default obRouter;
