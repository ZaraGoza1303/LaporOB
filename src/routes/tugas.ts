import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { tugasController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const tugasRouter = Router();
tugasRouter.use(verifyJWTToken);
tugasRouter.use(requireRole(USER_ROLE.ADMIN));

tugasRouter.get('/', (req, res) => tugasController.getAll(req, res));
tugasRouter.get('/:tugas_id', (req, res) => tugasController.getByID(req, res));
tugasRouter.post('/', (req, res) => tugasController.create(req, res));
tugasRouter.patch('/:tugas_id', (req, res) => tugasController.update(req, res));
tugasRouter.delete('/:tugas_id', (req, res) => tugasController.delete(req, res));

export default tugasRouter;
