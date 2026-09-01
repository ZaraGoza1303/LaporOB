import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { lokasiController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const lokasiRouter = Router();
lokasiRouter.use(verifyJWTToken);
lokasiRouter.use(requireRole(USER_ROLE.ADMIN, USER_ROLE.KARYAWAN));

lokasiRouter.get('/', (req, res) => lokasiController.getAll(req, res));
lokasiRouter.get('/:lokasi_id', (req, res) => lokasiController.getByID(req, res));
lokasiRouter.post('/', (req, res) => lokasiController.create(req, res));
lokasiRouter.patch('/:lokasi_id', (req, res) => lokasiController.update(req, res));
lokasiRouter.delete('/:lokasi_id',(req, res) => lokasiController.delete(req, res));

export default lokasiRouter;
