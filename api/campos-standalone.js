import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  updateCampo,
  deleteCampo
} from '../routes/camposController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// PUT /campos/:id - Actualizar campo
router.put('/:id', updateCampo);

// DELETE /campos/:id - Eliminar campo
router.delete('/:id', deleteCampo);

export default router;

