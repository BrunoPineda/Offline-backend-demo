import pool from '../config/database.js';

// Crear sección
export const createSeccion = async (req, res) => {
  try {
    const { id_formulario } = req.params;
    const { titulo, descripcion, orden } = req.body;

    if (!titulo || titulo.trim().length === 0) {
      return res.status(400).json({ error: 'El título de la sección es requerido' });
    }

    // Obtener el siguiente orden si no se proporciona
    let ordenFinal = orden;
    if (!ordenFinal) {
      const maxOrdenResult = await pool.query(
        'SELECT NVL(MAX(NU_ORDEN), 0) + 1 as next_orden FROM IDO_FORMULARIO.CBTC_SECCIONES WHERE ID_FORMULARIO = :1',
        [id_formulario]
      );
      ordenFinal = maxOrdenResult.rows[0].NEXT_ORDEN || maxOrdenResult.rows[0].next_orden || 1;
    }

    // Insertar sección
    await pool.query(
      `INSERT INTO IDO_FORMULARIO.CBTC_SECCIONES 
       (ID_FORMULARIO, NO_TITULO, DE_DESCRIPCION, NU_ORDEN, FE_CREACION, FE_ACTUALIZACION) 
       VALUES (:1, :2, :3, :4, SYSDATE, SYSDATE)`,
      [id_formulario, titulo.trim(), descripcion || null, ordenFinal],
      { autoCommit: true }
    );

    // Obtener la sección creada
    const result = await pool.query(
      `SELECT ID_SECCION as id, ID_FORMULARIO as id_formulario, NO_TITULO as titulo, 
              DE_DESCRIPCION as descripcion, NU_ORDEN as orden,
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM IDO_FORMULARIO.CBTC_SECCIONES 
       WHERE ID_FORMULARIO = :1 AND NO_TITULO = :2 
       ORDER BY FE_CREACION DESC`,
      [id_formulario, titulo.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Error al obtener la sección creada' });
    }

    // Normalizar
    const row = result.rows[0];
    const seccion = {
      id: row.ID !== undefined ? row.ID : row.id,
      id_formulario: row.ID_FORMULARIO !== undefined ? row.ID_FORMULARIO : row.id_formulario,
      titulo: row.TITULO !== undefined ? row.TITULO : row.titulo,
      descripcion: row.DESCRIPCION !== undefined ? row.DESCRIPCION : row.descripcion,
      orden: row.ORDEN !== undefined ? row.ORDEN : row.orden,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at
    };

    res.status(201).json(seccion);
  } catch (error) {
    console.error('Error al crear sección:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar sección
export const updateSeccion = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, orden } = req.body;

    if (!titulo || titulo.trim().length === 0) {
      return res.status(400).json({ error: 'El título de la sección es requerido' });
    }

    await pool.query(
      `UPDATE IDO_FORMULARIO.CBTC_SECCIONES 
       SET NO_TITULO = :1, DE_DESCRIPCION = :2, NU_ORDEN = :3 
       WHERE ID_SECCION = :4`,
      [titulo.trim(), descripcion || null, orden, id],
      { autoCommit: true }
    );

    // Obtener la sección actualizada
    const result = await pool.query(
      `SELECT ID_SECCION as id, ID_FORMULARIO as id_formulario, NO_TITULO as titulo, 
              DE_DESCRIPCION as descripcion, NU_ORDEN as orden,
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM IDO_FORMULARIO.CBTC_SECCIONES WHERE ID_SECCION = :1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    // Normalizar
    const row = result.rows[0];
    const seccion = {
      id: row.ID !== undefined ? row.ID : row.id,
      id_formulario: row.ID_FORMULARIO !== undefined ? row.ID_FORMULARIO : row.id_formulario,
      titulo: row.TITULO !== undefined ? row.TITULO : row.titulo,
      descripcion: row.DESCRIPCION !== undefined ? row.DESCRIPCION : row.descripcion,
      orden: row.ORDEN !== undefined ? row.ORDEN : row.orden,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at
    };

    res.json(seccion);
  } catch (error) {
    console.error('Error al actualizar sección:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar sección
export const deleteSeccion = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM IDO_FORMULARIO.CBTC_SECCIONES WHERE ID_SECCION = :1',
      [id],
      { autoCommit: true }
    );

    res.json({ message: 'Sección eliminada correctamente', seccion: { id: parseInt(id) } });
  } catch (error) {
    console.error('Error al eliminar sección:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

