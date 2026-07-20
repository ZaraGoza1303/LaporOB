import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { adminController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const adminRouter = Router();
adminRouter.use(verifyJWTToken);
adminRouter.use(requireRole(USER_ROLE.ADMIN));

//stats
adminRouter.get("/dashboard", (req, res) => adminController.getDashboardData(req, res));
adminRouter.get("/user-stats", (req, res) => adminController.getUserStats(req, res));

//penugasan ob
adminRouter.post("/user/assign-locations", (req, res) => adminController.assignObToLocations(req, res));
adminRouter.get("/user/assignments", (req, res) => adminController.getPenugasanByPeriode(req, res));

//laporan
adminRouter.get("/laporan/history", (req, res) => adminController.getAllHistoryLaporan(req, res));
adminRouter.get("/laporan", (req, res) => adminController.getAllLaporan(req, res));
adminRouter.get("/laporan/:laporan_id", (req, res) => adminController.getReportDetail(req, res));
adminRouter.patch("/laporan/:laporan_id", (req, res) => adminController.patchLaporan(req, res));
adminRouter.post("/laporan/:laporan_id/approve", (req, res) => adminController.approveLaporan(req, res));
adminRouter.post("/laporan/:laporan_id/reject", (req, res) => adminController.rejectLaporan(req, res));
adminRouter.delete("/laporan/:laporan_id", (req, res) => adminController.deleteLaporan(req, res));

export default adminRouter;
