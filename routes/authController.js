import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Función para realizar login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Buscar por username o email con su rol
    const result = await pool.query(
      `SELECT u.ID_USUARIO, u.NO_USERNAME, u.DI_CORREO, u.CO_PASSWORD_HASH, u.ID_ROL, 
              r.NO_ROL as ROL_NOMBRE
       FROM IDO_FORMULARIO.CBTC_USUARIOS u
       LEFT JOIN IDO_FORMULARIO.CBTC_ROLES r ON u.ID_ROL = r.ID_ROL
       WHERE u.NO_USERNAME = :1 OR u.DI_CORREO = :2`,
      [username, username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.CO_PASSWORD_HASH);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Siempre actualizar offline_password con la contraseña actual (por si cambió)
    // Esto permite que el login offline funcione con la contraseña más reciente
    const offlinePassword = crypto.createHash('md5').update(password).digest('hex');
    await pool.query(
      'UPDATE IDO_FORMULARIO.CBTC_USUARIOS SET CO_OFFLINE_PASSWORD = :1 WHERE ID_USUARIO = :2',
      [offlinePassword, user.ID_USUARIO]
    );
    console.log(`✅ offline_password actualizado para usuario ${user.NO_USERNAME} (MD5: ${offlinePassword})`);

    const token = jwt.sign(
      { id: user.ID_USUARIO, username: user.NO_USERNAME, rol: user.ROL_NOMBRE },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.ID_USUARIO,
        username: user.NO_USERNAME,
        email: user.DI_CORREO,
        id_rol: user.ID_ROL,
        rol_nombre: user.ROL_NOMBRE
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

