import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { lantaiController } from "../container.js";

const lantaiRouter = Router();
lantaiRouter.use(verifyJWTToken);
lantaiRouter.use(requireRole("admin"));

lantaiRouter.get('/', (req, res) => lantaiController.getAll(req, res));
lantaiRouter.get('/:lantai_id', (req, res) => lantaiController.getByID(req, res));
lantaiRouter.post('/', (req, res) => lantaiController.create(req, res));
lantaiRouter.patch('/:lantai_id', (req, res) => lantaiController.update(req, res));
lantaiRouter.delete('/:lantai_id', (req, res) => lantaiController.delete(req, res));

export default lantaiRouter;
