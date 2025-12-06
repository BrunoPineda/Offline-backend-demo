import bcrypt from 'bcryptjs';
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
      'SELECT * FROM usuarios WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      console.log('❌ El usuario o email ya existe');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO usuarios (username, password, email, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, email',
      [username, hashedPassword, email]
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

