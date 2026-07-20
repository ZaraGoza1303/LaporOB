import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { skillController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const skillRouter = Router();
skillRouter.use(verifyJWTToken);

skillRouter.get('/definitions', requireRole(USER_ROLE.ADMIN), (req, res) => skillController.getAllDefinitions(req, res));
skillRouter.post('/definitions', requireRole(USER_ROLE.ADMIN), (req, res) => skillController.createDefinition(req, res));
skillRouter.get('/definitions/:skill_id', requireRole(USER_ROLE.ADMIN), (req, res) => skillController.getDefinitionByID(req, res));
skillRouter.patch('/definitions/:skill_id', requireRole(USER_ROLE.ADMIN), (req, res) => skillController.updateDefinition(req, res));
skillRouter.delete('/definitions/:skill_id', requireRole(USER_ROLE.ADMIN), (req, res) => skillController.deleteDefinition(req, res));
skillRouter.post('/assign', requireRole(USER_ROLE.ADMIN), (req, res) => skillController.assignSkill(req, res));
skillRouter.get('/ob/:ob_id', requireRole(USER_ROLE.ADMIN, USER_ROLE.HR), (req, res) => skillController.getObSkills(req, res));
skillRouter.get('/me', requireRole(USER_ROLE.OB), (req, res) => skillController.getMySkills(req, res));

export default skillRouter;
