import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';

// Crear nuevo usuario
export const createUsuario = async (req, res) => {
  try {
    const { username, password, email, id_rol } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Usuario, contraseña y email son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT * FROM IDO_FORMULARIO.CBTC_USUARIOS WHERE NO_USERNAME = :1 OR DI_CORREO = :2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario o email ya existe' });
    }

    // Si no se proporciona rol, obtener el ID del rol ADMINISTRADOR por defecto
    let rolId = id_rol;
    if (!rolId) {
      const defaultRol = await pool.query(
        'SELECT ID_ROL FROM IDO_FORMULARIO.CBTC_ROLES WHERE NO_ROL = :1 AND FL_ACTIVO = :2',
        ['ADMINISTRADOR', 'S']
      );
      if (defaultRol.rows.length > 0) {
        rolId = defaultRol.rows[0].ID_ROL;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Calcular MD5 para login offline (menos seguro pero más simple)
    const offlinePassword = crypto.createHash('md5').update(password).digest('hex');

    // Insertar usuario y obtener el ID generado
    const result = await pool.query(
      `INSERT INTO IDO_FORMULARIO.CBTC_USUARIOS (NO_USERNAME, CO_PASSWORD_HASH, DI_CORREO, CO_OFFLINE_PASSWORD, ID_ROL, FE_CREACION) 
       VALUES (:1, :2, :3, :4, :5, SYSDATE)`,
      [username, hashedPassword, email, offlinePassword, rolId],
      { autoCommit: true }
    );

    // Obtener el usuario creado con su rol
    const newUser = await pool.query(
      `SELECT u.ID_USUARIO as id, u.NO_USERNAME as username, u.DI_CORREO as email, 
              u.ID_ROL as id_rol, r.NO_ROL as rol_nombre, u.FE_CREACION as created_at 
       FROM IDO_FORMULARIO.CBTC_USUARIOS u
       LEFT JOIN IDO_FORMULARIO.CBTC_ROLES r ON u.ID_ROL = r.ID_ROL
       WHERE u.NO_USERNAME = :1`,
      [username]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener usuarios con paginación
export const getUsuarios = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const includePassword = req.query.includePassword === 'true'; // Para sincronización offline
    
    // Obtener total de usuarios
    const countResult = await pool.query('SELECT COUNT(*) as total FROM IDO_FORMULARIO.CBTC_USUARIOS');
    const total = parseInt(countResult.rows[0].TOTAL);
    
    // Obtener usuarios paginados con sus roles
    // Si includePassword=true, incluir password hash y offline_password para sincronización offline
    const selectFields = includePassword 
      ? 'u.ID_USUARIO as id, u.NO_USERNAME as username, u.DI_CORREO as email, u.CO_PASSWORD_HASH as password, u.CO_OFFLINE_PASSWORD as offline_password, u.ID_ROL as id_rol, r.NO_ROL as rol_nombre, u.FE_CREACION as created_at'
      : 'u.ID_USUARIO as id, u.NO_USERNAME as username, u.DI_CORREO as email, u.ID_ROL as id_rol, r.NO_ROL as rol_nombre, u.FE_CREACION as created_at';
    
    const result = await pool.query(
      `SELECT ${selectFields} 
       FROM IDO_FORMULARIO.CBTC_USUARIOS u
       LEFT JOIN IDO_FORMULARIO.CBTC_ROLES r ON u.ID_ROL = r.ID_ROL
       ORDER BY u.FE_CREACION DESC OFFSET :1 ROWS FETCH NEXT :2 ROWS ONLY`,
      [offset, limit]
    );

    // Si se incluye password, renombrar a password_hash y incluir offline_password
    // Oracle devuelve nombres en mayúsculas cuando se usan alias
    const data = result.rows.map(user => {
      // Normalizar nombres (Oracle devuelve en mayúsculas)
      const userId = user.ID !== undefined ? user.ID : user.id;
      const userUsername = user.USERNAME !== undefined ? user.USERNAME : user.username;
      const userEmail = user.EMAIL !== undefined ? user.EMAIL : user.email;
      const userCreatedAt = user.CREATED_AT !== undefined ? user.CREATED_AT : user.created_at;
      const userRolId = user.ID_ROL !== undefined ? user.ID_ROL : (user.id_rol !== undefined ? user.id_rol : null);
      const userRolNombre = user.ROL_NOMBRE !== undefined ? user.ROL_NOMBRE : (user.rol_nombre !== undefined ? user.rol_nombre : null);
      
      if (includePassword) {
        const password = user.PASSWORD !== undefined ? user.PASSWORD : user.password;
        const offlinePassword = user.OFFLINE_PASSWORD !== undefined ? user.OFFLINE_PASSWORD : user.offline_password;
        
        const userData = {
          id: userId,
          username: userUsername,
          email: userEmail,
          id_rol: userRolId,
          rol_nombre: userRolNombre,
          created_at: userCreatedAt
        };
        
        if (password) {
          userData.password_hash = password; // Bcrypt hash para validación completa
        }
        if (offlinePassword) {
          userData.offline_password = offlinePassword; // MD5 para login offline simple
        }
        
        return userData;
      }
      
      // Normalizar nombres para respuesta sin password
      return {
        id: userId,
        username: userUsername,
        email: userEmail,
        id_rol: userRolId,
        rol_nombre: userRolNombre,
        created_at: userCreatedAt
      };
    });

    res.json({
      data: data,
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
};

// Obtener un usuario por ID
export const getUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.ID_USUARIO as id, u.NO_USERNAME as username, u.DI_CORREO as email, 
              u.ID_ROL as id_rol, r.NO_ROL as rol_nombre, u.FE_CREACION as created_at 
       FROM IDO_FORMULARIO.CBTC_USUARIOS u
       LEFT JOIN IDO_FORMULARIO.CBTC_ROLES r ON u.ID_ROL = r.ID_ROL
       WHERE u.ID_USUARIO = :1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Normalizar nombres de columnas (Oracle devuelve en mayúsculas)
    const row = result.rows[0];
    const usuario = {
      id: row.ID !== undefined ? row.ID : row.id,
      username: row.USERNAME !== undefined ? row.USERNAME : row.username,
      email: row.EMAIL !== undefined ? row.EMAIL : row.email,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at
    };

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar usuario
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, id_rol } = req.body;

    // Verificar que el usuario existe
    const existingUser = await pool.query(
      'SELECT * FROM IDO_FORMULARIO.CBTC_USUARIOS WHERE ID_USUARIO = :1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Validaciones
    if (!username || !email) {
      return res.status(400).json({ error: 'Usuario y email son requeridos' });
    }

    // Verificar si el nuevo username o email ya existe en otro usuario
    const duplicateCheck = await pool.query(
      'SELECT * FROM IDO_FORMULARIO.CBTC_USUARIOS WHERE (NO_USERNAME = :1 OR DI_CORREO = :2) AND ID_USUARIO != :3',
      [username, email, id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario o email ya existe' });
    }

    // Actualizar usuario
    if (password && password.trim().length > 0) {
      // Si se proporciona contraseña, actualizarla
      const hashedPassword = await bcrypt.hash(password, 10);
      const offlinePassword = crypto.createHash('md5').update(password).digest('hex');
      
      if (id_rol) {
        await pool.query(
          'UPDATE IDO_FORMULARIO.CBTC_USUARIOS SET NO_USERNAME = :1, DI_CORREO = :2, CO_PASSWORD_HASH = :3, CO_OFFLINE_PASSWORD = :4, ID_ROL = :5 WHERE ID_USUARIO = :6',
          [username.trim(), email.trim(), hashedPassword, offlinePassword, id_rol, id],
          { autoCommit: true }
        );
      } else {
        await pool.query(
          'UPDATE IDO_FORMULARIO.CBTC_USUARIOS SET NO_USERNAME = :1, DI_CORREO = :2, CO_PASSWORD_HASH = :3, CO_OFFLINE_PASSWORD = :4 WHERE ID_USUARIO = :5',
          [username.trim(), email.trim(), hashedPassword, offlinePassword, id],
          { autoCommit: true }
        );
      }
    } else {
      // Si no se proporciona contraseña, solo actualizar username, email y rol
      if (id_rol) {
        await pool.query(
          'UPDATE IDO_FORMULARIO.CBTC_USUARIOS SET NO_USERNAME = :1, DI_CORREO = :2, ID_ROL = :3 WHERE ID_USUARIO = :4',
          [username.trim(), email.trim(), id_rol, id],
          { autoCommit: true }
        );
      } else {
        await pool.query(
          'UPDATE IDO_FORMULARIO.CBTC_USUARIOS SET NO_USERNAME = :1, DI_CORREO = :2 WHERE ID_USUARIO = :3',
          [username.trim(), email.trim(), id],
          { autoCommit: true }
        );
      }
    }

    // Obtener el usuario actualizado con su rol
    const updatedUser = await pool.query(
      `SELECT u.ID_USUARIO as id, u.NO_USERNAME as username, u.DI_CORREO as email, 
              u.ID_ROL as id_rol, r.NO_ROL as rol_nombre, u.FE_CREACION as created_at 
       FROM IDO_FORMULARIO.CBTC_USUARIOS u
       LEFT JOIN IDO_FORMULARIO.CBTC_ROLES r ON u.ID_ROL = r.ID_ROL
       WHERE u.ID_USUARIO = :1`,
      [id]
    );

    // Normalizar nombres de columnas
    const row = updatedUser.rows[0];
    const usuario = {
      id: row.ID !== undefined ? row.ID : row.id,
      username: row.USERNAME !== undefined ? row.USERNAME : row.username,
      email: row.EMAIL !== undefined ? row.EMAIL : row.email,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at
    };

    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar usuario
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const existingUser = await pool.query(
      'SELECT ID_USUARIO as id, NO_USERNAME as username FROM IDO_FORMULARIO.CBTC_USUARIOS WHERE ID_USUARIO = :1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Eliminar usuario
    await pool.query(
      'DELETE FROM IDO_FORMULARIO.CBTC_USUARIOS WHERE ID_USUARIO = :1',
      [id],
      { autoCommit: true }
    );

    res.json({ message: 'Usuario eliminado correctamente', usuario: { id: parseInt(id) } });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

