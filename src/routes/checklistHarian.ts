import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { ChecklistHarianRepository } from "../repositories/checklistHarian_repository.js";
import { ChecklistHarianService } from "../services/checklistHarian_service.js";
import { ChecklistHarianController } from "../controllers/checklistHarian_controller.js";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";

const checklistHarianRouter = Router();

const db = new PrismaClient();
const checklistRepo = new ChecklistHarianRepository(db);
const checklistService = new ChecklistHarianService(checklistRepo);
const checklistController = new ChecklistHarianController(checklistService);

checklistHarianRouter.use(verifyJWTToken);

checklistHarianRouter.get('/', requireRole("ob", "hr", "admin"), (req, res) => checklistController.getAll(req, res));
checklistHarianRouter.get('/:checklist_harian_id', requireRole("ob", "hr", "admin"), (req, res) => checklistController.getByID(req, res));
checklistHarianRouter.post('/', requireRole("admin"), (req, res) => checklistController.create(req, res));
checklistHarianRouter.patch('/:checklist_harian_id', requireRole("admin"), (req, res) => checklistController.update(req, res));
checklistHarianRouter.delete('/:checklist_harian_id', requireRole("admin"), (req, res) => checklistController.delete(req, res));

export default checklistHarianRouter;
