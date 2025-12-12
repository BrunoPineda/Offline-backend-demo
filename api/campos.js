import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createCampo,
  updateCampo,
  deleteCampo
} from '../routes/camposController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /secciones/:id_seccion/campos - Crear nuevo campo
router.post('/:id_seccion/campos', createCampo);

export default router;

