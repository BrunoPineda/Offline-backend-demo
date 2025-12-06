import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /sync - Sincronizar cambios
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { lastSync } = req.body;
    const syncDate = lastSync ? new Date(lastSync) : new Date(0);

    // Obtener productos modificados desde la última sincronización
    const productosResult = await pool.query(
      'SELECT * FROM productos WHERE updated_at > $1 OR created_at > $1 ORDER BY updated_at DESC',
      [syncDate]
    );

    // Obtener usuarios modificados desde la última sincronización
    const usuariosResult = await pool.query(
      'SELECT id, username, email, created_at FROM usuarios WHERE created_at > $1 ORDER BY created_at DESC',
      [syncDate]
    );

    res.json({
      productos: productosResult.rows,
      usuarios: usuariosResult.rows,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en sincronización:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /sync/push - Enviar cambios del cliente al servidor
router.post('/push', authenticateToken, async (req, res) => {
  try {
    const { productos, usuarios } = req.body;
    const resultados = {
      productos: [],
      usuarios: [],
      errores: []
    };

    // Sincronizar productos
    if (productos && Array.isArray(productos)) {
      for (const producto of productos) {
        try {
          if (producto.id && producto.id < 0) {
            // Nuevo producto (ID negativo indica creación local)
            const result = await pool.query(
              'INSERT INTO productos (nombre, precio, cantidad, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
              [producto.nombre, producto.precio, producto.cantidad]
            );
            resultados.productos.push(result.rows[0]);
            req.io.emit('producto_creado', result.rows[0]);
          } else {
            // Actualizar producto existente
            const result = await pool.query(
              'UPDATE productos SET nombre = $1, precio = $2, cantidad = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
              [producto.nombre, producto.precio, producto.cantidad, producto.id]
            );
            if (result.rows.length > 0) {
              resultados.productos.push(result.rows[0]);
              req.io.emit('producto_actualizado', result.rows[0]);
            }
          }
        } catch (error) {
          resultados.errores.push({ producto, error: error.message });
        }
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error('Error en sincronización push:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

