import pool from '../config/database.js';

// Validación de formulario
export const validateFormulario = (titulo, estado) => {
  const errors = [];

  if (!titulo || titulo.trim().length === 0) {
    errors.push('El título es requerido');
  }
  if (titulo && titulo.length > 200) {
    errors.push('El título no puede exceder 200 caracteres');
  }
  if (estado && !['BORRADOR', 'PUBLICADO', 'CERRADO'].includes(estado)) {
    errors.push('El estado debe ser BORRADOR, PUBLICADO o CERRADO');
  }

  return errors;
};

// Crear nuevo formulario
export const createFormulario = async (req, res) => {
  try {
    const { titulo, descripcion, categoria, estado, fechaInicio, fechaFin } = req.body;
    const userId = req.user.id; // Del middleware de autenticación

    const validationErrors = validateFormulario(titulo, estado);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Convertir fechas de string (YYYY-MM-DD) a formato que Oracle entienda
    // Oracle puede manejar strings de fecha directamente con TO_DATE, o podemos pasar null
    let fechaInicioVal = null;
    let fechaFinVal = null;
    
    if (fechaInicio) {
      // Validar formato de fecha
      const fechaInicioDate = new Date(fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        return res.status(400).json({ error: 'Fecha de inicio inválida' });
      }
      fechaInicioVal = fechaInicio; // Mantener formato YYYY-MM-DD para TO_DATE
    }
    
    if (fechaFin) {
      const fechaFinDate = new Date(fechaFin);
      if (isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({ error: 'Fecha de fin inválida' });
      }
      fechaFinVal = fechaFin; // Mantener formato YYYY-MM-DD para TO_DATE
    }

    // Insertar formulario - usar TO_DATE cuando hay fecha, NULL cuando no hay
    // Nota: Cada bind parameter usado en CASE WHEN y TO_DATE debe pasarse dos veces
    await pool.query(
      `INSERT INTO IDO_FORMULARIO.CBTC_FORMULARIOS 
       (NO_TITULO, DE_DESCRIPCION, CO_ESTADO, CO_CATEGORIA, ID_USUARIO_CREADOR, FE_INICIO, FE_FIN, FE_CREACION, FE_ACTUALIZACION) 
       VALUES (:1, :2, :3, :4, :5, 
               CASE WHEN :6 IS NOT NULL THEN TO_DATE(:7, 'YYYY-MM-DD') ELSE NULL END,
               CASE WHEN :8 IS NOT NULL THEN TO_DATE(:9, 'YYYY-MM-DD') ELSE NULL END,
               SYSDATE, SYSDATE)`,
      [
        titulo.trim(),
        descripcion || null,
        estado || 'BORRADOR',
        categoria || null,
        userId,
        fechaInicioVal,  // :6 - para CASE WHEN
        fechaInicioVal,  // :7 - para TO_DATE
        fechaFinVal,     // :8 - para CASE WHEN
        fechaFinVal      // :9 - para TO_DATE
      ],
      { autoCommit: true }
    );

    // Obtener el formulario recién creado
    const result = await pool.query(
      `SELECT ID_FORMULARIO as id, NO_TITULO as titulo, DE_DESCRIPCION as descripcion, 
              CO_ESTADO as estado, CO_CATEGORIA as categoria, ID_USUARIO_CREADOR as id_usuario_creador,
              FE_INICIO as fecha_inicio, FE_FIN as fecha_fin,
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM (
         SELECT ID_FORMULARIO, NO_TITULO, DE_DESCRIPCION, CO_ESTADO, CO_CATEGORIA, 
                ID_USUARIO_CREADOR, FE_INICIO, FE_FIN, FE_CREACION, FE_ACTUALIZACION
         FROM IDO_FORMULARIO.CBTC_FORMULARIOS 
         WHERE NO_TITULO = :1 AND ID_USUARIO_CREADOR = :2
         ORDER BY FE_CREACION DESC
       ) WHERE ROWNUM = 1`,
      [titulo.trim(), userId]
    );

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Error al obtener el formulario creado' });
    }

    // Normalizar nombres de columnas
    const row = result.rows[0];
    const formulario = {
      id: row.ID !== undefined ? row.ID : row.id,
      titulo: row.TITULO !== undefined ? row.TITULO : row.titulo,
      descripcion: row.DESCRIPCION !== undefined ? row.DESCRIPCION : row.descripcion,
      estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
      categoria: row.CATEGORIA !== undefined ? row.CATEGORIA : row.categoria,
      id_usuario_creador: row.ID_USUARIO_CREADOR !== undefined ? row.ID_USUARIO_CREADOR : row.id_usuario_creador,
      fecha_inicio: row.FECHA_INICIO !== undefined ? row.FECHA_INICIO : row.fecha_inicio,
      fecha_fin: row.FECHA_FIN !== undefined ? row.FECHA_FIN : row.fecha_fin,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at
    };

    res.status(201).json(formulario);
  } catch (error) {
    console.error('Error al crear formulario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener un formulario completo por ID (con secciones y campos)
export const getFormulario = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener formulario
    const formularioResult = await pool.query(
      `SELECT ID_FORMULARIO as id, NO_TITULO as titulo, DE_DESCRIPCION as descripcion, 
              CO_ESTADO as estado, CO_CATEGORIA as categoria, ID_USUARIO_CREADOR as id_usuario_creador,
              FE_INICIO as fecha_inicio, FE_FIN as fecha_fin,
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM IDO_FORMULARIO.CBTC_FORMULARIOS WHERE ID_FORMULARIO = :1`,
      [id]
    );

    if (formularioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    // Normalizar formulario
    const row = formularioResult.rows[0];
    const formulario = {
      id: row.ID !== undefined ? row.ID : row.id,
      titulo: row.TITULO !== undefined ? row.TITULO : row.titulo,
      descripcion: row.DESCRIPCION !== undefined ? row.DESCRIPCION : row.descripcion,
      estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
      categoria: row.CATEGORIA !== undefined ? row.CATEGORIA : row.categoria,
      id_usuario_creador: row.ID_USUARIO_CREADOR !== undefined ? row.ID_USUARIO_CREADOR : row.id_usuario_creador,
      fecha_inicio: row.FECHA_INICIO !== undefined ? row.FECHA_INICIO : row.fecha_inicio,
      fecha_fin: row.FECHA_FIN !== undefined ? row.FECHA_FIN : row.fecha_fin,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at,
      secciones: []
    };

    // Obtener secciones
    const seccionesResult = await pool.query(
      `SELECT ID_SECCION as id, ID_FORMULARIO as id_formulario, NO_TITULO as titulo, 
              DE_DESCRIPCION as descripcion, NU_ORDEN as orden,
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM IDO_FORMULARIO.CBTC_SECCIONES 
       WHERE ID_FORMULARIO = :1 
       ORDER BY NU_ORDEN ASC`,
      [id]
    );

    // Normalizar secciones y obtener campos
    for (const seccionRow of seccionesResult.rows) {
      const seccion = {
        id: seccionRow.ID !== undefined ? seccionRow.ID : seccionRow.id,
        id_formulario: seccionRow.ID_FORMULARIO !== undefined ? seccionRow.ID_FORMULARIO : seccionRow.id_formulario,
        titulo: seccionRow.TITULO !== undefined ? seccionRow.TITULO : seccionRow.titulo,
        descripcion: seccionRow.DESCRIPCION !== undefined ? seccionRow.DESCRIPCION : seccionRow.descripcion,
        orden: seccionRow.ORDEN !== undefined ? seccionRow.ORDEN : seccionRow.orden,
        created_at: seccionRow.CREATED_AT !== undefined ? seccionRow.CREATED_AT : seccionRow.created_at,
        updated_at: seccionRow.UPDATED_AT !== undefined ? seccionRow.UPDATED_AT : seccionRow.updated_at,
        campos: []
      };

      const seccionId = seccion.id;

      // Obtener campos de la sección
      const camposResult = await pool.query(
        `SELECT ID_CAMPO as id, ID_SECCION as id_seccion, CO_TIPO as tipo, NO_LABEL as label,
                DE_PLACEHOLDER as placeholder, DE_VALOR_DEFECTO as valor_defecto, DE_AYUDA as ayuda,
                NU_ORDEN as orden, FL_OBLIGATORIO as obligatorio, FL_ACTIVO as activo,
                NU_MIN_CARACTERES as min_caracteres, NU_MAX_CARACTERES as max_caracteres,
                DE_PATRON_REGEX as patron_regex, NU_MIN_VALOR as min_valor, NU_MAX_VALOR as max_valor,
                FL_TIENE_OTRO as tiene_otro,
                FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
         FROM IDO_FORMULARIO.CBTC_CAMPOS 
         WHERE ID_SECCION = :1 
         ORDER BY NU_ORDEN ASC`,
        [seccionId]
      );

      // Normalizar campos y obtener opciones
      for (const campoRow of camposResult.rows) {
        const campo = {
          id: campoRow.ID !== undefined ? campoRow.ID : campoRow.id,
          id_seccion: campoRow.ID_SECCION !== undefined ? campoRow.ID_SECCION : campoRow.id_seccion,
          tipo: campoRow.TIPO !== undefined ? campoRow.TIPO : campoRow.tipo,
          label: campoRow.LABEL !== undefined ? campoRow.LABEL : campoRow.label,
          placeholder: campoRow.PLACEHOLDER !== undefined ? campoRow.PLACEHOLDER : campoRow.placeholder,
          valor_defecto: campoRow.VALOR_DEFECTO !== undefined ? campoRow.VALOR_DEFECTO : campoRow.valor_defecto,
          ayuda: campoRow.AYUDA !== undefined ? campoRow.AYUDA : campoRow.ayuda,
          orden: campoRow.ORDEN !== undefined ? campoRow.ORDEN : campoRow.orden,
          obligatorio: campoRow.OBLIGATORIO === 'S' || campoRow.obligatorio === 'S',
          activo: campoRow.ACTIVO === 'S' || campoRow.activo === 'S',
          min_caracteres: campoRow.MIN_CARACTERES !== undefined ? campoRow.MIN_CARACTERES : campoRow.min_caracteres,
          max_caracteres: campoRow.MAX_CARACTERES !== undefined ? campoRow.MAX_CARACTERES : campoRow.max_caracteres,
          patron_regex: campoRow.PATRON_REGEX !== undefined ? campoRow.PATRON_REGEX : campoRow.patron_regex,
          min_valor: campoRow.MIN_VALOR !== undefined ? campoRow.MIN_VALOR : campoRow.min_valor,
          max_valor: campoRow.MAX_VALOR !== undefined ? campoRow.MAX_VALOR : campoRow.max_valor,
          tiene_otro: campoRow.TIENE_OTRO === 'S' || campoRow.tiene_otro === 'S',
          created_at: campoRow.CREATED_AT !== undefined ? campoRow.CREATED_AT : campoRow.created_at,
          updated_at: campoRow.UPDATED_AT !== undefined ? campoRow.UPDATED_AT : campoRow.updated_at,
          opciones: []
        };

        const campoId = campo.id;

        // Si el campo tiene opciones (SELECCION, OPCION_UNICA, OPCION_MULTIPLE), obtenerlas
        if (['SELECCION', 'OPCION_UNICA', 'OPCION_MULTIPLE'].includes(campo.tipo)) {
          const opcionesResult = await pool.query(
            `SELECT ID_OPCION as id, ID_CAMPO as id_campo, NO_TEXTO as texto, 
                    DE_VALOR as valor, NU_ORDEN as orden,
                    FE_CREACION as created_at 
             FROM IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS 
             WHERE ID_CAMPO = :1 
             ORDER BY NU_ORDEN ASC`,
            [campoId]
          );

          campo.opciones = opcionesResult.rows.map(opcionRow => ({
            id: opcionRow.ID !== undefined ? opcionRow.ID : opcionRow.id,
            id_campo: opcionRow.ID_CAMPO !== undefined ? opcionRow.ID_CAMPO : opcionRow.id_campo,
            texto: opcionRow.TEXTO !== undefined ? opcionRow.TEXTO : opcionRow.texto,
            valor: opcionRow.VALOR !== undefined ? opcionRow.VALOR : opcionRow.valor,
            orden: opcionRow.ORDEN !== undefined ? opcionRow.ORDEN : opcionRow.orden,
            created_at: opcionRow.CREATED_AT !== undefined ? opcionRow.CREATED_AT : opcionRow.created_at
          }));
        }

        seccion.campos.push(campo);
      }

      formulario.secciones.push(seccion);
    }

    res.json(formulario);
  } catch (error) {
    console.error('Error al obtener formulario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener formularios con paginación
export const getFormularios = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const estado = req.query.estado; // Filtro opcional por estado
    const userId = req.user.id; // Del middleware

    let whereClause = '';
    let params = [];

    // Si no es administrador, solo ver formularios publicados disponibles
    // (esto se verificará con el rol, por ahora todos pueden ver)
    if (estado) {
      whereClause = 'WHERE CO_ESTADO = :1';
      params = [estado];
    } else {
      // Por defecto, mostrar formularios publicados o del usuario actual
      whereClause = 'WHERE (CO_ESTADO = :1 OR ID_USUARIO_CREADOR = :2)';
      params = ['PUBLICADO', userId];
    }

    // Obtener total de formularios
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM IDO_FORMULARIO.CBTC_FORMULARIOS ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].TOTAL);

    // Obtener formularios paginados con conteo de campos
    const result = await pool.query(
      `SELECT f.ID_FORMULARIO as id, f.NO_TITULO as titulo, f.DE_DESCRIPCION as descripcion, 
              f.CO_ESTADO as estado, f.CO_CATEGORIA as categoria, f.ID_USUARIO_CREADOR as id_usuario_creador,
              f.FE_INICIO as fecha_inicio, f.FE_FIN as fecha_fin,
              f.FE_CREACION as created_at, f.FE_ACTUALIZACION as updated_at,
              NVL((SELECT COUNT(*) FROM IDO_FORMULARIO.CBTC_CAMPOS c 
                   INNER JOIN IDO_FORMULARIO.CBTC_SECCIONES s ON c.ID_SECCION = s.ID_SECCION 
                   WHERE s.ID_FORMULARIO = f.ID_FORMULARIO), 0) as total_campos
       FROM IDO_FORMULARIO.CBTC_FORMULARIOS f
       ${whereClause}
       ORDER BY f.FE_CREACION DESC 
       OFFSET :${params.length + 1} ROWS FETCH NEXT :${params.length + 2} ROWS ONLY`,
      [...params, offset, limit]
    );

    // Normalizar nombres de columnas
    const data = result.rows.map(row => ({
      id: row.ID !== undefined ? row.ID : row.id,
      titulo: row.TITULO !== undefined ? row.TITULO : row.titulo,
      descripcion: row.DESCRIPCION !== undefined ? row.DESCRIPCION : row.descripcion,
      estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
      categoria: row.CATEGORIA !== undefined ? row.CATEGORIA : row.categoria,
      id_usuario_creador: row.ID_USUARIO_CREADOR !== undefined ? row.ID_USUARIO_CREADOR : row.id_usuario_creador,
      fecha_inicio: row.FECHA_INICIO !== undefined ? row.FECHA_INICIO : row.fecha_inicio,
      fecha_fin: row.FECHA_FIN !== undefined ? row.FECHA_FIN : row.fecha_fin,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at,
      total_campos: row.TOTAL_CAMPOS !== undefined ? parseInt(row.TOTAL_CAMPOS) : (row.total_campos !== undefined ? parseInt(row.total_campos) : 0)
    }));

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
    console.error('Error al obtener formularios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar formulario
export const updateFormulario = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, categoria, estado, fechaInicio, fechaFin } = req.body;
    const userId = req.user.id;

    const validationErrors = validateFormulario(titulo, estado);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Verificar que el formulario existe y pertenece al usuario
    const existing = await pool.query(
      'SELECT ID_FORMULARIO FROM IDO_FORMULARIO.CBTC_FORMULARIOS WHERE ID_FORMULARIO = :1 AND ID_USUARIO_CREADOR = :2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Formulario no encontrado o no tienes permisos' });
    }

    // Convertir fechas de string (YYYY-MM-DD) a formato que Oracle entienda
    let fechaInicioVal = null;
    let fechaFinVal = null;
    
    if (fechaInicio) {
      const fechaInicioDate = new Date(fechaInicio);
      if (isNaN(fechaInicioDate.getTime())) {
        return res.status(400).json({ error: 'Fecha de inicio inválida' });
      }
      fechaInicioVal = fechaInicio;
    }
    
    if (fechaFin) {
      const fechaFinDate = new Date(fechaFin);
      if (isNaN(fechaFinDate.getTime())) {
        return res.status(400).json({ error: 'Fecha de fin inválida' });
      }
      fechaFinVal = fechaFin;
    }

    // Actualizar formulario
    // Nota: Cada bind parameter usado en CASE WHEN y TO_DATE debe pasarse dos veces
    await pool.query(
      `UPDATE IDO_FORMULARIO.CBTC_FORMULARIOS 
       SET NO_TITULO = :1, DE_DESCRIPCION = :2, CO_ESTADO = :3, CO_CATEGORIA = :4, 
           FE_INICIO = CASE WHEN :5 IS NOT NULL THEN TO_DATE(:6, 'YYYY-MM-DD') ELSE NULL END,
           FE_FIN = CASE WHEN :7 IS NOT NULL THEN TO_DATE(:8, 'YYYY-MM-DD') ELSE NULL END
       WHERE ID_FORMULARIO = :9`,
      [
        titulo.trim(), 
        descripcion || null, 
        estado, 
        categoria || null, 
        fechaInicioVal,  // :5 - para CASE WHEN
        fechaInicioVal,  // :6 - para TO_DATE
        fechaFinVal,     // :7 - para CASE WHEN
        fechaFinVal,     // :8 - para TO_DATE
        id               // :9
      ],
      { autoCommit: true }
    );

    // Obtener el formulario actualizado
    const result = await pool.query(
      `SELECT ID_FORMULARIO as id, NO_TITULO as titulo, DE_DESCRIPCION as descripcion, 
              CO_ESTADO as estado, CO_CATEGORIA as categoria, ID_USUARIO_CREADOR as id_usuario_creador,
              FE_INICIO as fecha_inicio, FE_FIN as fecha_fin,
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM IDO_FORMULARIO.CBTC_FORMULARIOS WHERE ID_FORMULARIO = :1`,
      [id]
    );

    // Normalizar
    const row = result.rows[0];
    const formulario = {
      id: row.ID !== undefined ? row.ID : row.id,
      titulo: row.TITULO !== undefined ? row.TITULO : row.titulo,
      descripcion: row.DESCRIPCION !== undefined ? row.DESCRIPCION : row.descripcion,
      estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
      categoria: row.CATEGORIA !== undefined ? row.CATEGORIA : row.categoria,
      id_usuario_creador: row.ID_USUARIO_CREADOR !== undefined ? row.ID_USUARIO_CREADOR : row.id_usuario_creador,
      fecha_inicio: row.FECHA_INICIO !== undefined ? row.FECHA_INICIO : row.fecha_inicio,
      fecha_fin: row.FECHA_FIN !== undefined ? row.FECHA_FIN : row.fecha_fin,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at
    };

    res.json(formulario);
  } catch (error) {
    console.error('Error al actualizar formulario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar formulario
export const deleteFormulario = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar que el formulario existe y pertenece al usuario
    const existing = await pool.query(
      'SELECT ID_FORMULARIO FROM IDO_FORMULARIO.CBTC_FORMULARIOS WHERE ID_FORMULARIO = :1 AND ID_USUARIO_CREADOR = :2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Formulario no encontrado o no tienes permisos' });
    }

    // Eliminar formulario (CASCADE eliminará secciones, campos, etc.)
    await pool.query(
      'DELETE FROM IDO_FORMULARIO.CBTC_FORMULARIOS WHERE ID_FORMULARIO = :1',
      [id],
      { autoCommit: true }
    );

    res.json({ message: 'Formulario eliminado correctamente', formulario: { id: parseInt(id) } });
  } catch (error) {
    console.error('Error al eliminar formulario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Duplicar/Clonar formulario
export const duplicateFormulario = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Obtener formulario original
    const original = await pool.query(
      `SELECT ID_FORMULARIO, NO_TITULO, DE_DESCRIPCION, CO_ESTADO, CO_CATEGORIA, FE_INICIO, FE_FIN 
       FROM IDO_FORMULARIO.CBTC_FORMULARIOS WHERE ID_FORMULARIO = :1`,
      [id]
    );

    if (original.rows.length === 0) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    const orig = original.rows[0];
    
    // Obtener fechas del original y formatearlas si existen
    let fechaInicioStr = null;
    let fechaFinStr = null;
    
    const fechaInicioOrig = orig.FE_INICIO || orig.fe_inicio;
    const fechaFinOrig = orig.FE_FIN || orig.fe_fin;
    
    if (fechaInicioOrig) {
      if (fechaInicioOrig instanceof Date) {
        fechaInicioStr = fechaInicioOrig.toISOString().split('T')[0];
      } else if (typeof fechaInicioOrig === 'string') {
        fechaInicioStr = fechaInicioOrig.includes('T') ? fechaInicioOrig.split('T')[0] : fechaInicioOrig;
      } else {
        // Si es un objeto Oracle DATE, intentar formatearlo
        fechaInicioStr = fechaInicioOrig;
      }
    }
    
    if (fechaFinOrig) {
      if (fechaFinOrig instanceof Date) {
        fechaFinStr = fechaFinOrig.toISOString().split('T')[0];
      } else if (typeof fechaFinOrig === 'string') {
        fechaFinStr = fechaFinOrig.includes('T') ? fechaFinOrig.split('T')[0] : fechaFinOrig;
      } else {
        fechaFinStr = fechaFinOrig;
      }
    }

    // Crear nuevo formulario (como borrador) - usar CASE WHEN para manejar nulls
    // Nota: Cada bind parameter usado en CASE WHEN y TO_DATE debe pasarse dos veces
    await pool.query(
      `INSERT INTO IDO_FORMULARIO.CBTC_FORMULARIOS 
       (NO_TITULO, DE_DESCRIPCION, CO_ESTADO, CO_CATEGORIA, ID_USUARIO_CREADOR, FE_INICIO, FE_FIN, FE_CREACION, FE_ACTUALIZACION) 
       VALUES (:1, :2, 'BORRADOR', :3, :4,
               CASE WHEN :5 IS NOT NULL THEN TO_DATE(:6, 'YYYY-MM-DD') ELSE NULL END,
               CASE WHEN :7 IS NOT NULL THEN TO_DATE(:8, 'YYYY-MM-DD') ELSE NULL END,
               SYSDATE, SYSDATE)`,
      [
        `${orig.NO_TITULO || orig.no_titulo} (Copia)`,
        orig.DE_DESCRIPCION || orig.de_descripcion,
        orig.CO_CATEGORIA || orig.co_categoria,
        userId,
        fechaInicioStr,  // :5 - para CASE WHEN
        fechaInicioStr,  // :6 - para TO_DATE
        fechaFinStr,     // :7 - para CASE WHEN
        fechaFinStr      // :8 - para TO_DATE
      ],
      { autoCommit: true }
    );

    // Obtener el nuevo formulario
    const newFormResult = await pool.query(
      `SELECT ID_FORMULARIO FROM IDO_FORMULARIO.CBTC_FORMULARIOS 
       WHERE NO_TITULO = :1 AND ID_USUARIO_CREADOR = :2 
       ORDER BY FE_CREACION DESC`,
      [`${orig.NO_TITULO || orig.no_titulo} (Copia)`, userId]
    );

    if (newFormResult.rows.length === 0) {
      return res.status(500).json({ error: 'Error al crear formulario duplicado' });
    }

    const newFormId = newFormResult.rows[0].ID_FORMULARIO || newFormResult.rows[0].id_formulario;

    // Obtener secciones del original
    const secciones = await pool.query(
      'SELECT * FROM IDO_FORMULARIO.CBTC_SECCIONES WHERE ID_FORMULARIO = :1 ORDER BY NU_ORDEN',
      [id]
    );

    // Duplicar secciones y campos
    for (const seccion of secciones.rows) {
      // Crear nueva sección
      await pool.query(
        `INSERT INTO IDO_FORMULARIO.CBTC_SECCIONES 
         (ID_FORMULARIO, NO_TITULO, DE_DESCRIPCION, NU_ORDEN, FE_CREACION, FE_ACTUALIZACION) 
         VALUES (:1, :2, :3, :4, SYSDATE, SYSDATE)`,
        [
          newFormId,
          seccion.NO_TITULO || seccion.no_titulo,
          seccion.DE_DESCRIPCION || seccion.de_descripcion,
          seccion.NU_ORDEN || seccion.nu_orden
        ],
        { autoCommit: true }
      );

      // Obtener ID de la nueva sección
      const newSeccionResult = await pool.query(
        `SELECT ID_SECCION FROM IDO_FORMULARIO.CBTC_SECCIONES 
         WHERE ID_FORMULARIO = :1 AND NO_TITULO = :2 
         ORDER BY FE_CREACION DESC`,
        [newFormId, seccion.NO_TITULO || seccion.no_titulo]
      );

      const newSeccionId = newSeccionResult.rows[0].ID_SECCION || newSeccionResult.rows[0].id_seccion;
      const oldSeccionId = seccion.ID_SECCION || seccion.id_seccion;

      // Obtener campos de la sección original
      const campos = await pool.query(
        'SELECT * FROM IDO_FORMULARIO.CBTC_CAMPOS WHERE ID_SECCION = :1 ORDER BY NU_ORDEN',
        [oldSeccionId]
      );

      // Duplicar campos
      for (const campo of campos.rows) {
        await pool.query(
          `INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS 
           (ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, DE_VALOR_DEFECTO, DE_AYUDA, 
            NU_ORDEN, FL_OBLIGATORIO, FL_ACTIVO, NU_MIN_CARACTERES, NU_MAX_CARACTERES, 
            DE_PATRON_REGEX, NU_MIN_VALOR, NU_MAX_VALOR, FL_TIENE_OTRO, FE_CREACION, FE_ACTUALIZACION) 
           VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, SYSDATE, SYSDATE)`,
          [
            newSeccionId,
            campo.CO_TIPO || campo.co_tipo,
            campo.NO_LABEL || campo.no_label,
            campo.DE_PLACEHOLDER || campo.de_placeholder,
            campo.DE_VALOR_DEFECTO || campo.de_valor_defecto,
            campo.DE_AYUDA || campo.de_ayuda,
            campo.NU_ORDEN || campo.nu_orden,
            campo.FL_OBLIGATORIO || campo.fl_obligatorio,
            campo.FL_ACTIVO || campo.fl_activo,
            campo.NU_MIN_CARACTERES || campo.nu_min_caracteres,
            campo.NU_MAX_CARACTERES || campo.nu_max_caracteres,
            campo.DE_PATRON_REGEX || campo.de_patron_regex,
            campo.NU_MIN_VALOR || campo.nu_min_valor,
            campo.NU_MAX_VALOR || campo.nu_max_valor,
            campo.FL_TIENE_OTRO || campo.fl_tiene_otro
          ],
          { autoCommit: true }
        );

        // Obtener ID del nuevo campo
        const newCampoResult = await pool.query(
          `SELECT ID_CAMPO FROM IDO_FORMULARIO.CBTC_CAMPOS 
           WHERE ID_SECCION = :1 AND NO_LABEL = :2 
           ORDER BY FE_CREACION DESC`,
          [newSeccionId, campo.NO_LABEL || campo.no_label]
        );

        const newCampoId = newCampoResult.rows[0].ID_CAMPO || newCampoResult.rows[0].id_campo;
        const oldCampoId = campo.ID_CAMPO || campo.id_campo;

        // Si el campo tiene opciones, duplicarlas
        if (['SELECCION', 'OPCION_UNICA', 'OPCION_MULTIPLE'].includes(campo.CO_TIPO || campo.co_tipo)) {
          const opciones = await pool.query(
            'SELECT * FROM IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS WHERE ID_CAMPO = :1 ORDER BY NU_ORDEN',
            [oldCampoId]
          );

          for (const opcion of opciones.rows) {
            await pool.query(
              `INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS 
               (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) 
               VALUES (:1, :2, :3, :4, SYSDATE)`,
              [
                newCampoId,
                opcion.NO_TEXTO || opcion.no_texto,
                opcion.DE_VALOR || opcion.de_valor,
                opcion.NU_ORDEN || opcion.nu_orden
              ],
              { autoCommit: true }
            );
          }
        }
      }
    }

    // Obtener el formulario duplicado completo
    const newForm = await getFormulario({ params: { id: newFormId } }, res);
    return newForm;
  } catch (error) {
    console.error('Error al duplicar formulario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

