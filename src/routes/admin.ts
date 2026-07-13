import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { adminController, usersController } from "../container.js";

const adminRouter = Router();
adminRouter.use(verifyJWTToken);
adminRouter.use(requireRole("admin"));

//user crud
adminRouter.get("/user", (req, res) => usersController.getAll(req, res));
adminRouter.post("/user", (req, res) => usersController.create(req, res));

//ob
adminRouter.get("/user/all-ob", (req, res) => usersController.getAllOb(req, res));
adminRouter.get("/user/all-karyawan", (req, res) => usersController.getAllKaryawan(req, res));
adminRouter.get("/user/:user_id/performance", (req, res) => usersController.getObPerformanceStats(req, res));

adminRouter.get("/user/:user_id", (req, res) => usersController.getByID(req, res));
adminRouter.patch("/user/:user_id", (req, res) => usersController.update(req, res));
adminRouter.delete("/user/:user_id", (req, res) => usersController.delete(req, res));

//stats
adminRouter.get("/dashboard", (req, res) => adminController.getDashboardData(req, res));
adminRouter.get("/user-stats", (req, res) => adminController.getUserStats(req, res));

//penugasan ob
adminRouter.post("/user/assign-locations", (req, res) => adminController.assignObToLocations(req, res));
adminRouter.get("/user/assignments", (req, res) => adminController.getPenugasanByPeriode(req, res));

//laporan
adminRouter.get("/laporan", (req, res) => adminController.getAllLaporan(req, res));
adminRouter.get("/laporan/:laporan_id", (req, res) => adminController.getReportDetail(req, res));
adminRouter.patch("/laporan/:laporan_id", (req, res) => adminController.patchLaporan(req, res));

export default adminRouter;
