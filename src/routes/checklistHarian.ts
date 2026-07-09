import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { checklistHarianController } from "../container.js";

const checklistHarianRouter = Router();
checklistHarianRouter.use(verifyJWTToken);

checklistHarianRouter.get('/', requireRole("ob", "hr", "admin"), (req, res) => checklistHarianController.getAll(req, res));
checklistHarianRouter.get('/:checklist_harian_id', requireRole("ob", "hr", "admin"), (req, res) => checklistHarianController.getByID(req, res));
checklistHarianRouter.post('/', requireRole("admin"), (req, res) => checklistHarianController.create(req, res));
checklistHarianRouter.patch('/:checklist_harian_id', requireRole("admin"), (req, res) => checklistHarianController.update(req, res));
checklistHarianRouter.delete('/:checklist_harian_id', requireRole("admin"), (req, res) => checklistHarianController.delete(req, res));

export default checklistHarianRouter;
