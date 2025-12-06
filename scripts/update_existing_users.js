import pool from '../config/database.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Script para actualizar usuarios existentes con offline_password
// NOTA: Esto solo funciona si conoces las contraseñas originales
// Para usuarios existentes, necesitarás actualizarlos manualmente

const updateUsers = async () => {
  try {
    // Primero agregar la columna si no existe
    await pool.query(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS offline_password VARCHAR(32)
    `);
    console.log('✅ Columna offline_password agregada');

    // Actualizar usuario 'admin' con contraseña 'admin123'
    const password = 'admin123';
    const offlinePassword = crypto.createHash('md5').update(password).digest('hex');
    
    const result = await pool.query(
      'UPDATE usuarios SET offline_password = $1 WHERE username = $2 RETURNING username, offline_password',
      [offlinePassword, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ offline_password actualizado para usuario admin: ${offlinePassword}`);
    } else {
      console.log('⚠️ Usuario admin no encontrado');
    }
    
    // Actualizar todos los usuarios que no tengan offline_password
    // (solo si conoces sus contraseñas)
    const allUsers = await pool.query('SELECT id, username FROM usuarios WHERE offline_password IS NULL');
    console.log(`📋 Usuarios sin offline_password: ${allUsers.rows.length}`);
    for (const user of allUsers.rows) {
      console.log(`   - ${user.username} (ID: ${user.id})`);
    }

    console.log('✅ Script completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateUsers();

