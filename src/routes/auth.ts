import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { AuthRepository } from "../repositories/auth_repository.js";
import { AuthService } from "../services/auth_service.js";
import { AuthController } from "../controllers/auth_controller.js";

const authRouter = Router();

const db = new PrismaClient();
const authRepo = new AuthRepository(db);
const authService = new AuthService(authRepo);
const authController = new AuthController(authService);

authRouter.post('/login', (req, res) => authController.login(req, res));

export default authRouter;