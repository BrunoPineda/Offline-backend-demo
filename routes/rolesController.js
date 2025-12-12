import pool from '../config/database.js';

// Obtener todos los roles activos
export const getRoles = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ID_ROL, NO_ROL, DE_DESCRIPCION, FL_ACTIVO 
       FROM IDO_FORMULARIO.CBTC_ROLES 
       WHERE FL_ACTIVO = 'S' 
       ORDER BY NO_ROL`,
      [],
      { outFormat: pool.OUT_FORMAT_OBJECT }
    );

    // Normalizar nombres de columnas (Oracle devuelve en mayúsculas)
    const roles = result.rows.map(role => ({
      id: role.ID_ROL !== undefined ? role.ID_ROL : role.id_rol,
      nombre: role.NO_ROL !== undefined ? role.NO_ROL : role.no_rol,
      descripcion: role.DE_DESCRIPCION !== undefined ? role.DE_DESCRIPCION : role.de_descripcion,
      activo: role.FL_ACTIVO !== undefined ? role.FL_ACTIVO : role.fl_activo
    }));

    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

