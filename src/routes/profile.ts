import { Router } from "express";
import { PrismaClient } from "../generated/prisma/client.js";
import { ProfileRepository } from "../repositories/profile_repository.js";
import { ProfileService } from "../services/profile_service.js";
import { ProfileController } from "../controllers/profile_controller.js";
import { verifyJWTToken } from "../middleware/jwt.js";

const profileRouter = Router();

const db = new PrismaClient();
const profileRepo = new ProfileRepository(db);
const profileService = new ProfileService(profileRepo);
const profileController = new ProfileController(profileService);

profileRouter.use(verifyJWTToken);

profileRouter.get("/", (req, res) => profileController.getProfile(req, res));

export default profileRouter;
