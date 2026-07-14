import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { kategoriController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const kategoriRouter = Router();
kategoriRouter.use(verifyJWTToken);
kategoriRouter.use(requireRole(USER_ROLE.ADMIN));

kategoriRouter.get('/', (req, res) => kategoriController.getAll(req, res));
kategoriRouter.get('/:kategori_id', (req, res) => kategoriController.getByID(req, res));
kategoriRouter.post('/', (req, res) => kategoriController.create(req, res));
kategoriRouter.put('/:kategori_id', (req, res) => kategoriController.update(req, res));
kategoriRouter.delete('/:kategori_id', (req, res) => kategoriController.delete(req, res));

export default kategoriRouter;
