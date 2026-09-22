import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { adminController, jadwalChecklistController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const hrChecklistRouter = Router();
hrChecklistRouter.use(verifyJWTToken);
hrChecklistRouter.use(requireRole(USER_ROLE.HR, USER_ROLE.ADMIN));

hrChecklistRouter.get("/checklist-harian/approval-list", (req, res) => adminController.getApprovalListChecklist(req, res));

hrChecklistRouter.get("/jadwal-checklist", (req, res) => jadwalChecklistController.getAll(req, res));
hrChecklistRouter.get("/jadwal-checklist/:jadwal_checklist_id", (req, res) => jadwalChecklistController.getByID(req, res));
hrChecklistRouter.post("/jadwal-checklist", (req, res) => jadwalChecklistController.create(req, res));
hrChecklistRouter.patch("/jadwal-checklist/:jadwal_checklist_id", (req, res) => jadwalChecklistController.update(req, res));
hrChecklistRouter.delete("/jadwal-checklist/:jadwal_checklist_id", (req, res) => jadwalChecklistController.delete(req, res));

export default hrChecklistRouter;
