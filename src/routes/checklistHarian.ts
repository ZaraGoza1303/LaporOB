import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { checklistHarianController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const checklistHarianRouter = Router();
checklistHarianRouter.use(verifyJWTToken);

checklistHarianRouter.get('/', requireRole(USER_ROLE.OB, USER_ROLE.HR, USER_ROLE.ADMIN), (req, res) => checklistHarianController.getAll(req, res));
checklistHarianRouter.get('/:checklist_harian_id', requireRole(USER_ROLE.OB, USER_ROLE.HR, USER_ROLE.ADMIN), (req, res) => checklistHarianController.getByID(req, res));
checklistHarianRouter.post('/', requireRole(USER_ROLE.ADMIN), (req, res) => checklistHarianController.create(req, res));
checklistHarianRouter.patch('/:checklist_harian_id', requireRole(USER_ROLE.ADMIN), (req, res) => checklistHarianController.update(req, res));
checklistHarianRouter.delete('/:checklist_harian_id', requireRole(USER_ROLE.ADMIN), (req, res) => checklistHarianController.delete(req, res));

export default checklistHarianRouter;
