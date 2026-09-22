import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { ruanganController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const ruanganRouter = Router();
ruanganRouter.use(verifyJWTToken);
const readAccess = requireRole(USER_ROLE.ADMIN, USER_ROLE.KARYAWAN, USER_ROLE.HR);
const writeAccess = requireRole(USER_ROLE.ADMIN, USER_ROLE.KARYAWAN);

ruanganRouter.get('/', readAccess, (req, res) => ruanganController.getAll(req, res));
ruanganRouter.get('/:ruangan_id', readAccess, (req, res) => ruanganController.getByID(req, res));
ruanganRouter.post('/', writeAccess, (req, res) => ruanganController.create(req, res));
ruanganRouter.patch('/:ruangan_id', writeAccess, (req, res) => ruanganController.update(req, res));
ruanganRouter.delete('/:ruangan_id', writeAccess, (req, res) => ruanganController.delete(req, res));

export default ruanganRouter;
