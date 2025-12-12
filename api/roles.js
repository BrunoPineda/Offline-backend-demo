import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getRoles } from '../routes/rolesController.js';

const router = express.Router();

// GET /roles - Obtener todos los roles activos
router.get('/', authenticateToken, getRoles);

export default router;

