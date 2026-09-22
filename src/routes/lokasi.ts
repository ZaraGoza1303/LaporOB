import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { lokasiController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const lokasiRouter = Router();
lokasiRouter.use(verifyJWTToken);
const readAccess = requireRole(USER_ROLE.ADMIN, USER_ROLE.KARYAWAN, USER_ROLE.HR);
const writeAccess = requireRole(USER_ROLE.ADMIN, USER_ROLE.KARYAWAN);

lokasiRouter.get('/', readAccess, (req, res) => lokasiController.getAll(req, res));
lokasiRouter.get('/:lokasi_id', readAccess, (req, res) => lokasiController.getByID(req, res));
lokasiRouter.post('/', writeAccess, (req, res) => lokasiController.create(req, res));
lokasiRouter.patch('/:lokasi_id', writeAccess, (req, res) => lokasiController.update(req, res));
lokasiRouter.delete('/:lokasi_id', writeAccess, (req, res) => lokasiController.delete(req, res));

export default lokasiRouter;
