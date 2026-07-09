import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { ruanganController } from "../container.js";

const ruanganRouter = Router();
ruanganRouter.use(verifyJWTToken);
ruanganRouter.use(requireRole("admin"));

ruanganRouter.get('/', (req, res) => ruanganController.getAll(req, res));
ruanganRouter.get('/:ruangan_id', (req, res) => ruanganController.getByID(req, res));
ruanganRouter.post('/', (req, res) => ruanganController.create(req, res));
ruanganRouter.patch('/:ruangan_id', (req, res) => ruanganController.update(req, res));
ruanganRouter.delete('/:ruangan_id', (req, res) => ruanganController.delete(req, res));

export default ruanganRouter;
