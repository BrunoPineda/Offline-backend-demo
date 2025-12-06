import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /usuarios - Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Usuario, contraseña y email son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario o email ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO usuarios (username, password, email, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, email, created_at',
      [username, hashedPassword, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /usuarios - Obtener usuarios con paginación
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Obtener total de usuarios
    const countResult = await pool.query('SELECT COUNT(*) FROM usuarios');
    const total = parseInt(countResult.rows[0].count);
    
    // Obtener usuarios paginados
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM usuarios ORDER BY created_at DESC LIMIT $1 OFFSET $2',
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
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

