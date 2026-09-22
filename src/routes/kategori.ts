import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { kategoriController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const kategoriRouter = Router();
kategoriRouter.use(verifyJWTToken);
const readAccess = requireRole(USER_ROLE.ADMIN, USER_ROLE.KARYAWAN, USER_ROLE.HR);
const writeAccess = requireRole(USER_ROLE.ADMIN, USER_ROLE.KARYAWAN);
kategoriRouter.get('/', readAccess, (req, res) => kategoriController.getAll(req, res));
kategoriRouter.get('/:kategori_id', readAccess, (req, res) => kategoriController.getByID(req, res));
kategoriRouter.post('/', writeAccess, (req, res) => kategoriController.create(req, res));
kategoriRouter.put('/:kategori_id', writeAccess, (req, res) => kategoriController.update(req, res));
kategoriRouter.delete('/:kategori_id', writeAccess, (req, res) => kategoriController.delete(req, res));

export default kategoriRouter;
