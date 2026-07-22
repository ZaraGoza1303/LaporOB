import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { achievementController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const achievementRouter = Router();
achievementRouter.use(verifyJWTToken);

achievementRouter.get('/', requireRole(USER_ROLE.ADMIN), (req, res) => achievementController.getAll(req, res));
achievementRouter.post('/', requireRole(USER_ROLE.ADMIN), (req, res) => achievementController.create(req, res));
achievementRouter.get('/:achievement_id', requireRole(USER_ROLE.ADMIN), (req, res) => achievementController.getByID(req, res));
achievementRouter.patch('/:achievement_id', requireRole(USER_ROLE.ADMIN), (req, res) => achievementController.update(req, res));
achievementRouter.delete('/:achievement_id', requireRole(USER_ROLE.ADMIN), (req, res) => achievementController.delete(req, res));
achievementRouter.get('/ob/:ob_id', requireRole(USER_ROLE.ADMIN, USER_ROLE.HR), (req, res) => achievementController.getObAchievements(req, res));
achievementRouter.get('/me', requireRole(USER_ROLE.OB), (req, res) => achievementController.getMyAchievements(req, res));

export default achievementRouter;
