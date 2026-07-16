import { Router } from "express";
import { authController } from "../container.js";
import { loginLimiter } from "../middleware/rateLimiter.js";
import { verifyJWTToken } from "../middleware/jwt.js";

const authRouter = Router();

authRouter.get('/check-token', (req, res) => authController.verifyActivation(req, res));
authRouter.post('/login', loginLimiter, (req, res) => authController.login(req, res));
authRouter.post('/activate-account', (req, res) => authController.activateAccount(req, res));
authRouter.post('/logout', verifyJWTToken, (req, res) => authController.logout(req, res));

export default authRouter;
