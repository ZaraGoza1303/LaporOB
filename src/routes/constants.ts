import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { constantsController } from "../container.js";

const constantsRouter = Router();
constantsRouter.use(verifyJWTToken);

constantsRouter.get('/', (req, res) => constantsController.getConstants(req, res));

export default constantsRouter;
