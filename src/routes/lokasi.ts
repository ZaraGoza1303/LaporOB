import { Router } from "express";
import { verifyJWTToken, authorizeRole } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { lokasiController } from "../container.js";

const lokasiRouter = Router();
lokasiRouter.use(verifyJWTToken);
lokasiRouter.use(authorizeRole("admin"));

lokasiRouter.get('/', (req, res) => lokasiController.getAll(req, res));
lokasiRouter.get('/:lokasi_id', (req, res) => lokasiController.getByID(req, res));
lokasiRouter.post('/', requireRole("admin"), (req, res) => lokasiController.create(req, res));
lokasiRouter.patch('/:lokasi_id', requireRole("admin"), (req, res) => lokasiController.update(req, res));
lokasiRouter.delete('/:lokasi_id', requireRole("admin"), (req, res) => lokasiController.delete(req, res));

export default lokasiRouter;
