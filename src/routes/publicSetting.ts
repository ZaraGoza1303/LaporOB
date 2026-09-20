import { Router } from "express";
import { settingController } from "../container.js";

const publicSettingRouter = Router();

publicSettingRouter.get('/branding', (req, res) => settingController.getPublic(req, res));

export default publicSettingRouter;
