import { Router } from "express";
import { verifyJWTToken } from "../middleware/jwt.js";
import { requireRole } from "../middleware/role.js";
import { lantaiController } from "../container.js";
import { USER_ROLE } from "../utils/constants.js";

const lantaiRouter = Router();
lantaiRouter.use(verifyJWTToken);
const readAccess = requireRole(USER_ROLE.ADMIN, USER_ROLE.KARYAWAN, USER_ROLE.HR);
const writeAccess = requireRole(USER_ROLE.ADMIN, USER_ROLE.KARYAWAN);

lantaiRouter.get('/', readAccess, (req, res) => lantaiController.getAll(req, res));
lantaiRouter.get('/:lantai_id', readAccess, (req, res) => lantaiController.getByID(req, res));
lantaiRouter.post('/', writeAccess, (req, res) => lantaiController.create(req, res));
lantaiRouter.patch('/:lantai_id', writeAccess, (req, res) => lantaiController.update(req, res));
lantaiRouter.delete('/:lantai_id', writeAccess, (req, res) => lantaiController.delete(req, res));

export default lantaiRouter;
