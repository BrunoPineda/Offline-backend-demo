import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validación de producto
const validateProduct = (nombre, precio, cantidad) => {
  const errors = [];

  if (!nombre || nombre.trim().length === 0) {
    errors.push('El nombre es requerido');
  }
  if (nombre && nombre.length > 30) {
    errors.push('El nombre no puede exceder 30 caracteres');
  }
  if (precio === undefined || precio === null) {
    errors.push('El precio es requerido');
  }
  if (precio < 0) {
    errors.push('El precio no puede ser negativo');
  }
  if (cantidad === undefined || cantidad === null) {
    errors.push('La cantidad es requerida');
  }
  if (cantidad < 0) {
    errors.push('La cantidad no puede ser negativa');
  }

  return errors;
};

// POST /productos - Crear nuevo producto
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nombre, precio, cantidad } = req.body;

    const validationErrors = validateProduct(nombre, precio, cantidad);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const result = await pool.query(
      'INSERT INTO productos (nombre, precio, cantidad, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [nombre.trim(), precio, cantidad]
    );

    const producto = result.rows[0];
    
    // Emitir evento Socket.io
    req.io.emit('producto_creado', producto);
    req.io.emit('producto_actualizado', producto);

    res.status(201).json(producto);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /productos - Obtener productos con paginación
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Obtener total de productos
    const countResult = await pool.query('SELECT COUNT(*) FROM productos');
    const total = parseInt(countResult.rows[0].count);
    
    // Obtener productos paginados
    const result = await pool.query(
      'SELECT * FROM productos ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /productos/:id - Actualizar producto
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, cantidad } = req.body;

    const validationErrors = validateProduct(nombre, precio, cantidad);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const result = await pool.query(
      'UPDATE productos SET nombre = $1, precio = $2, cantidad = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [nombre.trim(), precio, cantidad, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const producto = result.rows[0];
    
    // Emitir evento Socket.io
    req.io.emit('producto_actualizado', producto);

    res.json(producto);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /productos/:id - Eliminar producto
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM productos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Emitir evento Socket.io
    req.io.emit('producto_eliminado', { id: parseInt(id) });

    res.json({ message: 'Producto eliminado correctamente', producto: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

