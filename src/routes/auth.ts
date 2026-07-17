import { Router } from "express";
import { authController } from "../container.js";
import { loginLimiter } from "../middleware/rateLimiter.js";
import { verifyJWTToken } from "../middleware/jwt.js";

const authRouter = Router();

authRouter.get('/check-token', (req, res) => authController.verifyActivation(req, res));
authRouter.post('/login', loginLimiter, (req, res) => authController.login(req, res));
authRouter.post('/activate-account', (req, res) => authController.activateAccount(req, res));
authRouter.post('/logout', verifyJWTToken, (req, res) => authController.logout(req, res));
authRouter.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
authRouter.post('/reset-password', (req, res) => authController.resetPassword(req, res));
authRouter.post('/change-password', verifyJWTToken, (req, res) => authController.changePassword(req, res));

export default authRouter;
