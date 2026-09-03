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

const hrRouter = Router();

hrRouter.use(verifyJWTToken);
hrRouter.use(requireRole(USER_ROLE.HR, USER_ROLE.ADMIN));

// Data SDM (Read-only)
hrRouter.get("/users/ob", (req, res) => usersController.getAllOb(req, res));
hrRouter.get("/users/karyawan", (req, res) => usersController.getAllKaryawan(req, res));
hrRouter.get("/users/:user_id", (req, res) => usersController.getByID(req, res));

// Statistik & Monitoring Performa
hrRouter.get("/performance/dashboard", (req, res) => adminController.getObPerformanceDashboard(req, res));
hrRouter.get("/performance/ranking", (req, res) => adminController.getObRanking(req, res));
hrRouter.get("/performance/ob/:user_id", (req, res) => usersController.getObPerformanceStats(req, res));
hrRouter.get("/performance/karyawan/:user_id", (req, res) => usersController.getKarywanPerformanceStats(req, res));

// Skill & Achievement OB
hrRouter.get("/ob/:ob_id/skills", (req, res) => skillController.getObSkills(req, res));
hrRouter.get("/ob/:ob_id/achievements", (req, res) => achievementController.getObAchievements(req, res));

export default hrRouter;
