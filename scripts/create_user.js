import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const createUser = async () => {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';
  const email = process.argv[4] || 'admin@example.com';

  try {
    // Verificar si el usuario ya existe
    const existing = await pool.query(
      'SELECT * FROM IDO_FORMULARIO.CBTC_USUARIOS WHERE NO_USERNAME = :1 OR DI_CORREO = :2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      console.log('❌ El usuario o email ya existe');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Calcular MD5 para login offline
    const offlinePassword = crypto.createHash('md5').update(password).digest('hex');

    // Obtener ID del rol ADMINISTRADOR (por defecto)
    const rolResult = await pool.query(
      'SELECT ID_ROL FROM IDO_FORMULARIO.CBTC_ROLES WHERE NO_ROL = :1',
      ['ADMINISTRADOR']
    );
    
    let idRol = null;
    if (rolResult.rows.length > 0) {
      idRol = rolResult.rows[0].ID_ROL || rolResult.rows[0].id_rol;
    }

    // Insertar usuario
    await pool.query(
      `INSERT INTO IDO_FORMULARIO.CBTC_USUARIOS (NO_USERNAME, CO_PASSWORD_HASH, DI_CORREO, CO_OFFLINE_PASSWORD, ID_ROL, FE_CREACION) 
       VALUES (:1, :2, :3, :4, :5, SYSDATE)`,
      [username, hashedPassword, email, offlinePassword, idRol],
      { autoCommit: true }
    );

    // Obtener el usuario creado con su rol
    const result = await pool.query(
      `SELECT u.ID_USUARIO as id, u.NO_USERNAME as username, u.DI_CORREO as email, 
              u.ID_ROL as id_rol, r.NO_ROL as rol, u.FE_CREACION as created_at 
       FROM IDO_FORMULARIO.CBTC_USUARIOS u
       LEFT JOIN IDO_FORMULARIO.CBTC_ROLES r ON u.ID_ROL = r.ID_ROL
       WHERE u.NO_USERNAME = :1`,
      [username]
    );

    console.log('✅ Usuario creado exitosamente:');
    console.log(result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    process.exit(1);
  }
};

createUser();
