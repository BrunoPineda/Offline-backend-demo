import pool from '../config/database.js';

// Tipos de campos válidos
const TIPOS_CAMPOS_VALIDOS = ['TEXTO_CORTO', 'TEXTO_LARGO', 'SELECCION', 'OPCION_UNICA', 'OPCION_MULTIPLE', 'FECHA', 'NUMERO', 'EMAIL'];

// Validar campo
export const validateCampo = (tipo, label) => {
  const errors = [];

  if (!tipo || !TIPOS_CAMPOS_VALIDOS.includes(tipo)) {
    errors.push(`El tipo debe ser uno de: ${TIPOS_CAMPOS_VALIDOS.join(', ')}`);
  }
  if (!label || label.trim().length === 0) {
    errors.push('El label es requerido');
  }
  if (label && label.length > 200) {
    errors.push('El label no puede exceder 200 caracteres');
  }

  return errors;
};

// Crear campo
export const createCampo = async (req, res) => {
  try {
    const { id_seccion } = req.params;
    const { tipo, label, placeholder, valor_defecto, ayuda, orden, obligatorio, activo,
            min_caracteres, max_caracteres, patron_regex, min_valor, max_valor, tiene_otro, opciones } = req.body;

    const validationErrors = validateCampo(tipo, label);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Obtener el siguiente orden si no se proporciona
    let ordenFinal = orden;
    if (!ordenFinal) {
      const maxOrdenResult = await pool.query(
        'SELECT NVL(MAX(NU_ORDEN), 0) + 1 as next_orden FROM IDO_FORMULARIO.CBTC_CAMPOS WHERE ID_SECCION = :1',
        [id_seccion]
      );
      ordenFinal = maxOrdenResult.rows[0].NEXT_ORDEN || maxOrdenResult.rows[0].next_orden || 1;
    }

    // Insertar campo
    await pool.query(
      `INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS 
       (ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, DE_VALOR_DEFECTO, DE_AYUDA, 
        NU_ORDEN, FL_OBLIGATORIO, FL_ACTIVO, NU_MIN_CARACTERES, NU_MAX_CARACTERES, 
        DE_PATRON_REGEX, NU_MIN_VALOR, NU_MAX_VALOR, FL_TIENE_OTRO, FE_CREACION, FE_ACTUALIZACION) 
       VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, SYSDATE, SYSDATE)`,
      [
        id_seccion,
        tipo,
        label.trim(),
        placeholder || null,
        valor_defecto || null,
        ayuda || null,
        ordenFinal,
        obligatorio === true ? 'S' : 'N',
        activo !== false ? 'S' : 'N',
        min_caracteres || null,
        max_caracteres || null,
        patron_regex || null,
        min_valor || null,
        max_valor || null,
        tiene_otro === true ? 'S' : 'N'
      ],
      { autoCommit: true }
    );

    // Obtener el campo creado
    const result = await pool.query(
      `SELECT ID_CAMPO as id, ID_SECCION as id_seccion, CO_TIPO as tipo, NO_LABEL as label,
              DE_PLACEHOLDER as placeholder, DE_VALOR_DEFECTO as valor_defecto, DE_AYUDA as ayuda,
              NU_ORDEN as orden, FL_OBLIGATORIO as obligatorio, FL_ACTIVO as activo,
              NU_MIN_CARACTERES as min_caracteres, NU_MAX_CARACTERES as max_caracteres,
              DE_PATRON_REGEX as patron_regex, NU_MIN_VALOR as min_valor, NU_MAX_VALOR as max_valor,
              FL_TIENE_OTRO as tiene_otro,
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM IDO_FORMULARIO.CBTC_CAMPOS 
       WHERE ID_SECCION = :1 AND NO_LABEL = :2 
       ORDER BY FE_CREACION DESC`,
      [id_seccion, label.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Error al obtener el campo creado' });
    }

    // Normalizar
    const row = result.rows[0];
    const campo = {
      id: row.ID !== undefined ? row.ID : row.id,
      id_seccion: row.ID_SECCION !== undefined ? row.ID_SECCION : row.id_seccion,
      tipo: row.TIPO !== undefined ? row.TIPO : row.tipo,
      label: row.LABEL !== undefined ? row.LABEL : row.label,
      placeholder: row.PLACEHOLDER !== undefined ? row.PLACEHOLDER : row.placeholder,
      valor_defecto: row.VALOR_DEFECTO !== undefined ? row.VALOR_DEFECTO : row.valor_defecto,
      ayuda: row.AYUDA !== undefined ? row.AYUDA : row.ayuda,
      orden: row.ORDEN !== undefined ? row.ORDEN : row.orden,
      obligatorio: row.OBLIGATORIO === 'S' || row.obligatorio === 'S',
      activo: row.ACTIVO === 'S' || row.activo === 'S',
      min_caracteres: row.MIN_CARACTERES !== undefined ? row.MIN_CARACTERES : row.min_caracteres,
      max_caracteres: row.MAX_CARACTERES !== undefined ? row.MAX_CARACTERES : row.max_caracteres,
      patron_regex: row.PATRON_REGEX !== undefined ? row.PATRON_REGEX : row.patron_regex,
      min_valor: row.MIN_VALOR !== undefined ? row.MIN_VALOR : row.min_valor,
      max_valor: row.MAX_VALOR !== undefined ? row.MAX_VALOR : row.max_valor,
      tiene_otro: row.TIENE_OTRO === 'S' || row.tiene_otro === 'S',
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at,
      opciones: []
    };

    const campoId = campo.id;

    // Si el campo tiene opciones, crearlas
    if (opciones && Array.isArray(opciones) && opciones.length > 0 && 
        ['SELECCION', 'OPCION_UNICA', 'OPCION_MULTIPLE'].includes(tipo)) {
      for (let i = 0; i < opciones.length; i++) {
        const opcion = opciones[i];
        await pool.query(
          `INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS 
           (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) 
           VALUES (:1, :2, :3, :4, SYSDATE)`,
          [
            campoId,
            opcion.texto || opcion.text,
            opcion.valor || opcion.value || opcion.texto || opcion.text,
            opcion.orden || (i + 1)
          ],
          { autoCommit: true }
        );
      }

      // Obtener opciones creadas
      const opcionesResult = await pool.query(
        `SELECT ID_OPCION as id, ID_CAMPO as id_campo, NO_TEXTO as texto, 
                DE_VALOR as valor, NU_ORDEN as orden, FE_CREACION as created_at 
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

    res.status(201).json(campo);
  } catch (error) {
    console.error('Error al crear campo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar campo
export const updateCampo = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, label, placeholder, valor_defecto, ayuda, orden, obligatorio, activo,
            min_caracteres, max_caracteres, patron_regex, min_valor, max_valor, tiene_otro, opciones } = req.body;

    const validationErrors = validateCampo(tipo, label);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Actualizar campo
    await pool.query(
      `UPDATE IDO_FORMULARIO.CBTC_CAMPOS 
       SET CO_TIPO = :1, NO_LABEL = :2, DE_PLACEHOLDER = :3, DE_VALOR_DEFECTO = :4, DE_AYUDA = :5,
           NU_ORDEN = :6, FL_OBLIGATORIO = :7, FL_ACTIVO = :8, 
           NU_MIN_CARACTERES = :9, NU_MAX_CARACTERES = :10, DE_PATRON_REGEX = :11,
           NU_MIN_VALOR = :12, NU_MAX_VALOR = :13, FL_TIENE_OTRO = :14
       WHERE ID_CAMPO = :15`,
      [
        tipo,
        label.trim(),
        placeholder || null,
        valor_defecto || null,
        ayuda || null,
        orden,
        obligatorio === true ? 'S' : 'N',
        activo !== false ? 'S' : 'N',
        min_caracteres || null,
        max_caracteres || null,
        patron_regex || null,
        min_valor || null,
        max_valor || null,
        tiene_otro === true ? 'S' : 'N',
        id
      ],
      { autoCommit: true }
    );

    // Si el campo tiene opciones, actualizarlas (eliminar las antiguas y crear las nuevas)
    if (opciones && Array.isArray(opciones) && ['SELECCION', 'OPCION_UNICA', 'OPCION_MULTIPLE'].includes(tipo)) {
      // Eliminar opciones existentes
      await pool.query(
        'DELETE FROM IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS WHERE ID_CAMPO = :1',
        [id],
        { autoCommit: true }
      );

      // Crear nuevas opciones
      for (let i = 0; i < opciones.length; i++) {
        const opcion = opciones[i];
        await pool.query(
          `INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS 
           (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) 
           VALUES (:1, :2, :3, :4, SYSDATE)`,
          [
            id,
            opcion.texto || opcion.text,
            opcion.valor || opcion.value || opcion.texto || opcion.text,
            opcion.orden || (i + 1)
          ],
          { autoCommit: true }
        );
      }
    }

    // Obtener el campo actualizado
    const result = await pool.query(
      `SELECT ID_CAMPO as id, ID_SECCION as id_seccion, CO_TIPO as tipo, NO_LABEL as label,
              DE_PLACEHOLDER as placeholder, DE_VALOR_DEFECTO as valor_defecto, DE_AYUDA as ayuda,
              NU_ORDEN as orden, FL_OBLIGATORIO as obligatorio, FL_ACTIVO as activo,
              NU_MIN_CARACTERES as min_caracteres, NU_MAX_CARACTERES as max_caracteres,
              DE_PATRON_REGEX as patron_regex, NU_MIN_VALOR as min_valor, NU_MAX_VALOR as max_valor,
              FL_TIENE_OTRO as tiene_otro,
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM IDO_FORMULARIO.CBTC_CAMPOS WHERE ID_CAMPO = :1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }

    // Normalizar
    const row = result.rows[0];
    const campo = {
      id: row.ID !== undefined ? row.ID : row.id,
      id_seccion: row.ID_SECCION !== undefined ? row.ID_SECCION : row.id_seccion,
      tipo: row.TIPO !== undefined ? row.TIPO : row.tipo,
      label: row.LABEL !== undefined ? row.LABEL : row.label,
      placeholder: row.PLACEHOLDER !== undefined ? row.PLACEHOLDER : row.placeholder,
      valor_defecto: row.VALOR_DEFECTO !== undefined ? row.VALOR_DEFECTO : row.valor_defecto,
      ayuda: row.AYUDA !== undefined ? row.AYUDA : row.ayuda,
      orden: row.ORDEN !== undefined ? row.ORDEN : row.orden,
      obligatorio: row.OBLIGATORIO === 'S' || row.obligatorio === 'S',
      activo: row.ACTIVO === 'S' || row.activo === 'S',
      min_caracteres: row.MIN_CARACTERES !== undefined ? row.MIN_CARACTERES : row.min_caracteres,
      max_caracteres: row.MAX_CARACTERES !== undefined ? row.MAX_CARACTERES : row.max_caracteres,
      patron_regex: row.PATRON_REGEX !== undefined ? row.PATRON_REGEX : row.patron_regex,
      min_valor: row.MIN_VALOR !== undefined ? row.MIN_VALOR : row.min_valor,
      max_valor: row.MAX_VALOR !== undefined ? row.MAX_VALOR : row.max_valor,
      tiene_otro: row.TIENE_OTRO === 'S' || row.tiene_otro === 'S',
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at,
      opciones: []
    };

    // Obtener opciones si las tiene
    if (['SELECCION', 'OPCION_UNICA', 'OPCION_MULTIPLE'].includes(campo.tipo)) {
      const opcionesResult = await pool.query(
        `SELECT ID_OPCION as id, ID_CAMPO as id_campo, NO_TEXTO as texto, 
                DE_VALOR as valor, NU_ORDEN as orden, FE_CREACION as created_at 
         FROM IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS 
         WHERE ID_CAMPO = :1 
         ORDER BY NU_ORDEN ASC`,
        [id]
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

    res.json(campo);
  } catch (error) {
    console.error('Error al actualizar campo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar campo
export const deleteCampo = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM IDO_FORMULARIO.CBTC_CAMPOS WHERE ID_CAMPO = :1',
      [id],
      { autoCommit: true }
    );

    res.json({ message: 'Campo eliminado correctamente', campo: { id: parseInt(id) } });
  } catch (error) {
    console.error('Error al eliminar campo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

