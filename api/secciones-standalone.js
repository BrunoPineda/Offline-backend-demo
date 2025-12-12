import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  updateSeccion,
  deleteSeccion
} from '../routes/seccionesController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// PUT /secciones/:id - Actualizar sección
router.put('/:id', updateSeccion);

// DELETE /secciones/:id - Eliminar sección
router.delete('/:id', deleteSeccion);

export default router;

