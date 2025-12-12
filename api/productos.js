import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createProducto,
  getProducto,
  getProductos,
  updateProducto,
  deleteProducto
} from '../routes/productosController.js';

const router = express.Router();

// POST /productos - Crear nuevo producto
router.post('/', authenticateToken, createProducto);

// GET /productos - Obtener productos con paginación (debe ir antes de GET /:id)
router.get('/', authenticateToken, getProductos);

// GET /productos/:id - Obtener un producto por ID
router.get('/:id', authenticateToken, getProducto);

// PUT /productos/:id - Actualizar producto
router.put('/:id', authenticateToken, updateProducto);

// DELETE /productos/:id - Eliminar producto
router.delete('/:id', authenticateToken, deleteProducto);

export default router;

