import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createFormulario,
  getFormulario,
  getFormularios,
  updateFormulario,
  deleteFormulario,
  duplicateFormulario
} from '../routes/formulariosController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /formularios - Crear nuevo formulario
router.post('/', createFormulario);

// GET /formularios - Obtener formularios con paginación
router.get('/', getFormularios);

// GET /formularios/:id - Obtener un formulario completo por ID
router.get('/:id', getFormulario);

// PUT /formularios/:id - Actualizar formulario
router.put('/:id', updateFormulario);

// DELETE /formularios/:id - Eliminar formulario
router.delete('/:id', deleteFormulario);

// POST /formularios/:id/duplicate - Duplicar formulario
router.post('/:id/duplicate', duplicateFormulario);

export default router;

