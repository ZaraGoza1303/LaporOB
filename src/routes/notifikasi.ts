import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { notificationController } from "../container.js";

const notifikasiRouter = Router();
notifikasiRouter.use(verifyJWTToken);

notifikasiRouter.get("/", (req, res) => notificationController.getAllNotifications(req, res));
notifikasiRouter.get("/unread-count", (req, res) => notificationController.countUnread(req, res));
notifikasiRouter.patch("/read-all", (req, res) => notificationController.markAllAsRead(req, res));
notifikasiRouter.patch("/:notification_id/read", (req, res) => notificationController.markAsRead(req, res));

export default notifikasiRouter;
