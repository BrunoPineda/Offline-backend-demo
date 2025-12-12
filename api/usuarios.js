import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createUsuario,
  getUsuario,
  getUsuarios,
  updateUsuario,
  deleteUsuario
} from '../routes/usuariosController.js';

const router = express.Router();

// POST /usuarios - Crear nuevo usuario
router.post('/', createUsuario);

// GET /usuarios - Obtener usuarios con paginación (debe ir antes de GET /:id)
router.get('/', authenticateToken, getUsuarios);

// GET /usuarios/:id - Obtener un usuario por ID
router.get('/:id', authenticateToken, getUsuario);

// PUT /usuarios/:id - Actualizar usuario
router.put('/:id', authenticateToken, updateUsuario);

// DELETE /usuarios/:id - Eliminar usuario
router.delete('/:id', authenticateToken, deleteUsuario);

export default router;

