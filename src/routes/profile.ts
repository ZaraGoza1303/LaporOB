import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { usersController } from "../container.js";

const profileRouter = Router();
profileRouter.use(verifyJWTToken);

profileRouter.get("/profile", (req, res) => usersController.getProfile(req, res));
profileRouter.patch("/profile", (req, res) => usersController.updateProfile(req, res));

export default profileRouter;
