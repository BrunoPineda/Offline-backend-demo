import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createSeccion
} from '../routes/seccionesController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /formularios/:id_formulario/secciones - Crear nueva sección
router.post('/:id_formulario/secciones', createSeccion);

export default router;

