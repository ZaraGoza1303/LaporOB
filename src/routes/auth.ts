import { Router } from "express";
import { authController } from "../container.js";

const authRouter = Router();

authRouter.get('/check-token', (req, res) => authController.verifyActivation(req, res));
authRouter.post('/login', (req, res) => authController.login(req, res));
authRouter.post('/login-activation', (req, res) => authController.loginActivation(req, res));

export default authRouter;
