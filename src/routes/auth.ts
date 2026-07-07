import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { AuthRepository } from "../repositories/auth_repository.js";
import { AuthService } from "../services/auth_service.js";
import { AuthController } from "../controllers/auth_controller.js";
import { UsersRepository } from "../repositories/users_repository.js";

const authRouter = Router();

const db = new PrismaClient();
const authRepo = new AuthRepository(db);
const usersRepo = new UsersRepository(db);
const authService = new AuthService(authRepo, usersRepo);
const authController = new AuthController(authService);

authRouter.get('/check-token', (req, res) => authController.verifyActivation(req, res));
authRouter.post('/login', (req, res) => authController.login(req, res));
authRouter.post('/login-activation', (req, res) => authController.loginActivation(req, res));


export default authRouter;