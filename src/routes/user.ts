import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { UsersRepository } from "../repositories/users_repository.js";
import { UsersService } from "../services/users_service.js";
import { UsersController } from "../controllers/users_controller.js";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { StorageServiceFactory } from '../services/storage_service.factory.js';

const userRouter = Router();

const db = new PrismaClient();
const userRepo = new UsersRepository(db);
const userService = new UsersService(userRepo);

const storageService = StorageServiceFactory.getProvider();
const userController = new UsersController(userService, storageService);

userRouter.use(verifyJWTToken);
userRouter.use(requireRole("admin"));

userRouter.get("/", (req, res) => userController.getAll(req, res));
userRouter.get("/:user_id", (req, res) => userController.getByID(req, res));
userRouter.post("/", (req, res) => userController.create(req, res));
userRouter.patch("/:user_id",(req, res) => userController.update(req, res));
userRouter.delete("/:user_id", (req, res) => userController.delete(req, res));

export default userRouter;