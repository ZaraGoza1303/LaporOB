import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import {
    usersController,
    adminController,
    skillController,
    achievementController
} from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const hrPerformanceRouter = Router();
hrPerformanceRouter.use(verifyJWTToken);
hrPerformanceRouter.use(requireRole(USER_ROLE.HR, USER_ROLE.ADMIN));

hrPerformanceRouter.get("/performance/dashboard", (req, res) => adminController.getObPerformanceDashboard(req, res));
hrPerformanceRouter.get("/performance/ranking", (req, res) => adminController.getObRanking(req, res));
hrPerformanceRouter.get("/performance/ob/:user_id", (req, res) => usersController.getObPerformanceStats(req, res));
hrPerformanceRouter.get("/performance/karyawan/:user_id", (req, res) => usersController.getKarywanPerformanceStats(req, res));

hrPerformanceRouter.get("/ob/:ob_id/skills", (req, res) => skillController.getObSkills(req, res));
hrPerformanceRouter.get("/ob/:ob_id/achievements", (req, res) => achievementController.getObAchievements(req, res));

export default hrPerformanceRouter;
