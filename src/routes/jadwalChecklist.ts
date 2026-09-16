import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { jadwalChecklistController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const jadwalChecklistRouter = Router();
jadwalChecklistRouter.use(verifyJWTToken);
jadwalChecklistRouter.use(requireRole(USER_ROLE.ADMIN, USER_ROLE.HR));

jadwalChecklistRouter.get('/', (req, res) => jadwalChecklistController.getAll(req, res));
jadwalChecklistRouter.post('/', (req, res) => jadwalChecklistController.create(req, res));
jadwalChecklistRouter.get('/:jadwal_checklist_id', (req, res) => jadwalChecklistController.getByID(req, res));
jadwalChecklistRouter.patch('/:jadwal_checklist_id', (req, res) => jadwalChecklistController.update(req, res));
jadwalChecklistRouter.delete('/:jadwal_checklist_id', (req, res) => jadwalChecklistController.delete(req, res));

export default jadwalChecklistRouter;
