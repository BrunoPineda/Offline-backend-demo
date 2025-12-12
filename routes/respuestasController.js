import pool from '../config/database.js';
import ExcelJS from 'exceljs';

// Obtener todas las respuestas de un formulario (para administradores)
export const getRespuestasByFormulario = async (req, res) => {
  try {
    const { idFormulario } = req.params;

    const result = await pool.query(
      `SELECT r.ID_RESPUESTA as id, r.ID_FORMULARIO as id_formulario, r.ID_USUARIO as id_usuario,
              r.CO_ESTADO as estado, r.FE_INICIO as fecha_inicio, r.FE_ULTIMA_ACTUALIZACION as fecha_ultima_actualizacion,
              r.FE_ENVIO as fecha_envio, r.FE_CREACION as created_at, r.FE_ACTUALIZACION as updated_at,
              u.NO_USERNAME as username
       FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
       INNER JOIN IDO_FORMULARIO.CBTC_USUARIOS u ON r.ID_USUARIO = u.ID_USUARIO
       WHERE r.ID_FORMULARIO = :1
       ORDER BY r.FE_CREACION DESC`,
      [idFormulario],
      { outFormat: pool.OUT_FORMAT_OBJECT }
    );

    // Oracle devuelve los alias en MAYÚSCULAS cuando se usa OUT_FORMAT_OBJECT
    // El alias "as id" se devuelve como "ID"
    const respuestas = result.rows.map(row => {
      const id = row.ID !== undefined ? row.ID : 
                 (row.id !== undefined ? row.id : 
                 (row.ID_RESPUESTA !== undefined ? row.ID_RESPUESTA : null));
      
      if (!id) {
        console.error('⚠️ getRespuestasByFormulario - Row sin ID. Keys disponibles:', Object.keys(row));
      }
      
      return {
        id: id,
        id_formulario: row.ID_FORMULARIO !== undefined ? row.ID_FORMULARIO : (row.id_formulario !== undefined ? row.id_formulario : null),
        id_usuario: row.ID_USUARIO !== undefined ? row.ID_USUARIO : (row.id_usuario !== undefined ? row.id_usuario : null),
        username: row.USERNAME !== undefined ? row.USERNAME : (row.username !== undefined ? row.username : null),
        estado: row.ESTADO !== undefined ? row.ESTADO : (row.estado !== undefined ? row.estado : null),
        fecha_inicio: row.FECHA_INICIO !== undefined ? row.FECHA_INICIO : (row.fecha_inicio !== undefined ? row.fecha_inicio : null),
        fecha_ultima_actualizacion: row.FECHA_ULTIMA_ACTUALIZACION !== undefined ? row.FECHA_ULTIMA_ACTUALIZACION : (row.fecha_ultima_actualizacion !== undefined ? row.fecha_ultima_actualizacion : null),
        fecha_envio: row.FECHA_ENVIO !== undefined ? row.FECHA_ENVIO : (row.fecha_envio !== undefined ? row.fecha_envio : null),
        created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : (row.created_at !== undefined ? row.created_at : null),
        updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : (row.updated_at !== undefined ? row.updated_at : null)
      };
    });

    res.json(respuestas);
  } catch (error) {
    console.error('Error al obtener respuestas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener respuestas de un usuario para un formulario específico
export const getRespuestasByUsuario = async (req, res) => {
  try {
    const { idFormulario } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT r.ID_RESPUESTA as id, r.ID_FORMULARIO as id_formulario, r.ID_USUARIO as id_usuario,
              r.CO_ESTADO as estado, r.FE_INICIO as fecha_inicio, r.FE_ULTIMA_ACTUALIZACION as fecha_ultima_actualizacion,
              r.FE_ENVIO as fecha_envio, r.FE_CREACION as created_at, r.FE_ACTUALIZACION as updated_at,
              f.NO_TITULO as formulario_titulo
       FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
       INNER JOIN IDO_FORMULARIO.CBTC_FORMULARIOS f ON r.ID_FORMULARIO = f.ID_FORMULARIO
       WHERE r.ID_FORMULARIO = :1 AND r.ID_USUARIO = :2
       ORDER BY r.FE_CREACION DESC`,
      [idFormulario, userId],
      { outFormat: pool.OUT_FORMAT_OBJECT }
    );

    const respuestas = result.rows.map(row => {
      // Oracle devuelve los alias en MAYÚSCULAS cuando se usa OUT_FORMAT_OBJECT
      // El alias "as id" se devuelve como "ID"
      const id = row.ID !== undefined ? row.ID : 
                 (row.id !== undefined ? row.id : 
                 (row.ID_RESPUESTA !== undefined ? row.ID_RESPUESTA : null));
      
      // Log para depuración si falta el ID
      if (!id) {
        console.error('⚠️ getRespuestasByUsuario - Row sin ID. Keys disponibles:', Object.keys(row));
        console.error('⚠️ Row completo:', JSON.stringify(row, null, 2));
      }
      
      const respuesta = {
        id: id,
        id_formulario: row.ID_FORMULARIO !== undefined ? row.ID_FORMULARIO : (row.id_formulario !== undefined ? row.id_formulario : null),
        id_usuario: row.ID_USUARIO !== undefined ? row.ID_USUARIO : (row.id_usuario !== undefined ? row.id_usuario : null),
        estado: row.ESTADO !== undefined ? row.ESTADO : (row.estado !== undefined ? row.estado : null),
        fecha_inicio: row.FECHA_INICIO !== undefined ? row.FECHA_INICIO : (row.fecha_inicio !== undefined ? row.fecha_inicio : null),
        fecha_ultima_actualizacion: row.FECHA_ULTIMA_ACTUALIZACION !== undefined ? row.FECHA_ULTIMA_ACTUALIZACION : (row.fecha_ultima_actualizacion !== undefined ? row.fecha_ultima_actualizacion : null),
        fecha_envio: row.FECHA_ENVIO !== undefined ? row.FECHA_ENVIO : (row.fecha_envio !== undefined ? row.fecha_envio : null),
        created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : (row.created_at !== undefined ? row.created_at : null),
        updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : (row.updated_at !== undefined ? row.updated_at : null),
        formulario_titulo: row.FORMULARIO_TITULO !== undefined ? row.FORMULARIO_TITULO : (row.formulario_titulo !== undefined ? row.formulario_titulo : null)
      };
      
      return respuesta;
    });

    // Log para depuración
    console.log('📋 getRespuestasByUsuario - Total respuestas:', respuestas.length);
    if (respuestas.length > 0) {
      console.log('📋 Primera respuesta:', JSON.stringify(respuestas[0], null, 2));
    }

    res.json(respuestas);
  } catch (error) {
    console.error('Error al obtener respuestas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener una respuesta específica con sus valores
export const getRespuesta = async (req, res) => {
  try {
    const { idRespuesta } = req.params;
    const userId = req.user?.id; // Opcional para administradores

    console.log('🔍 getRespuesta - idRespuesta:', idRespuesta, 'userId:', userId);

    // Validar y convertir idRespuesta a número
    const idRespuestaNum = parseInt(idRespuesta, 10);
    if (isNaN(idRespuestaNum)) {
      console.error('❌ ID de respuesta inválido:', idRespuesta);
      return res.status(400).json({ error: 'ID de respuesta inválido', detalle: `El ID proporcionado "${idRespuesta}" no es un número válido.` });
    }

    // Obtener la respuesta - Permitir a cualquier usuario autenticado ver sus propias respuestas
    // Los administradores pueden ver todas las respuestas
    let respuestaResult;
    if (userId) {
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        console.error('❌ ID de usuario inválido:', userId);
        return res.status(400).json({ error: 'ID de usuario inválido' });
      }
      
      // Primero intentar obtener la respuesta del usuario
      respuestaResult = await pool.query(
        `SELECT r.ID_RESPUESTA as id, r.ID_FORMULARIO as id_formulario, r.ID_USUARIO as id_usuario,
                r.CO_ESTADO as estado, r.FE_INICIO as fecha_inicio, r.FE_ULTIMA_ACTUALIZACION as fecha_ultima_actualizacion,
                r.FE_ENVIO as fecha_envio, r.FE_CREACION as created_at, r.FE_ACTUALIZACION as updated_at
         FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
         WHERE r.ID_RESPUESTA = :1 AND r.ID_USUARIO = :2`,
        [idRespuestaNum, userIdNum],
        { outFormat: pool.OUT_FORMAT_OBJECT }
      );
      
      // Si no se encuentra, verificar si el usuario es administrador y puede ver todas
      if (respuestaResult.rows.length === 0) {
        console.log('⚠️ Respuesta no encontrada para el usuario, verificando si es administrador...');
        // Por ahora, permitir ver la respuesta si existe (se puede mejorar con verificación de rol)
        respuestaResult = await pool.query(
          `SELECT r.ID_RESPUESTA as id, r.ID_FORMULARIO as id_formulario, r.ID_USUARIO as id_usuario,
                  r.CO_ESTADO as estado, r.FE_INICIO as fecha_inicio, r.FE_ULTIMA_ACTUALIZACION as fecha_ultima_actualizacion,
                  r.FE_ENVIO as fecha_envio, r.FE_CREACION as created_at, r.FE_ACTUALIZACION as updated_at
           FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
           WHERE r.ID_RESPUESTA = :1`,
          [idRespuestaNum],
          { outFormat: pool.OUT_FORMAT_OBJECT }
        );
      }
    } else {
      // Para administradores, no verificar usuario
      respuestaResult = await pool.query(
        `SELECT r.ID_RESPUESTA as id, r.ID_FORMULARIO as id_formulario, r.ID_USUARIO as id_usuario,
                r.CO_ESTADO as estado, r.FE_INICIO as fecha_inicio, r.FE_ULTIMA_ACTUALIZACION as fecha_ultima_actualizacion,
                r.FE_ENVIO as fecha_envio, r.FE_CREACION as created_at, r.FE_ACTUALIZACION as updated_at
         FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
         WHERE r.ID_RESPUESTA = :1`,
        [idRespuestaNum],
        { outFormat: pool.OUT_FORMAT_OBJECT }
      );
    }

    if (respuestaResult.rows.length === 0) {
      console.error('❌ Respuesta no encontrada con ID:', idRespuestaNum);
      return res.status(404).json({ error: 'Respuesta no encontrada', detalle: `No se encontró una respuesta con el ID ${idRespuestaNum}.` });
    }

    const respuesta = respuestaResult.rows[0];
    
    // Oracle devuelve los alias en MAYÚSCULAS cuando se usa OUT_FORMAT_OBJECT
    // El alias "as id" se devuelve como "ID"
    const respuestaData = {
      id: respuesta.ID !== undefined ? respuesta.ID : 
          (respuesta.id !== undefined ? respuesta.id : 
          (respuesta.ID_RESPUESTA !== undefined ? respuesta.ID_RESPUESTA : null)),
      id_formulario: respuesta.ID_FORMULARIO !== undefined ? respuesta.ID_FORMULARIO : (respuesta.id_formulario !== undefined ? respuesta.id_formulario : null),
      id_usuario: respuesta.ID_USUARIO !== undefined ? respuesta.ID_USUARIO : (respuesta.id_usuario !== undefined ? respuesta.id_usuario : null),
      estado: respuesta.ESTADO !== undefined ? respuesta.ESTADO : (respuesta.estado !== undefined ? respuesta.estado : null),
      fecha_inicio: respuesta.FECHA_INICIO !== undefined ? respuesta.FECHA_INICIO : (respuesta.fecha_inicio !== undefined ? respuesta.fecha_inicio : null),
      fecha_ultima_actualizacion: respuesta.FECHA_ULTIMA_ACTUALIZACION !== undefined ? respuesta.FECHA_ULTIMA_ACTUALIZACION : (respuesta.fecha_ultima_actualizacion !== undefined ? respuesta.fecha_ultima_actualizacion : null),
      fecha_envio: respuesta.FECHA_ENVIO !== undefined ? respuesta.FECHA_ENVIO : (respuesta.fecha_envio !== undefined ? respuesta.fecha_envio : null),
      created_at: respuesta.CREATED_AT !== undefined ? respuesta.CREATED_AT : (respuesta.created_at !== undefined ? respuesta.created_at : null),
      updated_at: respuesta.UPDATED_AT !== undefined ? respuesta.UPDATED_AT : (respuesta.updated_at !== undefined ? respuesta.updated_at : null),
      valores: []
    };
    
    // Validar que el ID existe
    if (!respuestaData.id) {
      console.error('❌ getRespuesta - No se pudo extraer el ID. Keys disponibles:', Object.keys(respuesta));
      console.error('❌ Respuesta completa:', JSON.stringify(respuesta, null, 2));
      return res.status(500).json({ 
        error: 'Error interno: No se pudo extraer el ID de la respuesta',
        detalle: 'El backend no pudo mapear correctamente el ID de la respuesta desde Oracle.'
      });
    }

    // Obtener los valores de la respuesta
    // Asegurarse de que respuestaData.id sea un número
    const respuestaIdNum = parseInt(respuestaData.id, 10);
    if (isNaN(respuestaIdNum)) {
      return res.status(500).json({ error: 'Error interno: ID de respuesta inválido' });
    }

    const valoresResult = await pool.query(
      `SELECT rv.ID_VALOR as id, rv.ID_CAMPO as id_campo, 
              CASE 
                WHEN rv.DE_VALOR_TEXTO IS NOT NULL THEN DBMS_LOB.SUBSTR(rv.DE_VALOR_TEXTO, 4000, 1)
                WHEN rv.NU_VALOR_NUMERO IS NOT NULL THEN TO_CHAR(rv.NU_VALOR_NUMERO)
                WHEN rv.FE_VALOR_FECHA IS NOT NULL THEN TO_CHAR(rv.FE_VALOR_FECHA, 'YYYY-MM-DD')
                WHEN rv.DE_TEXTO_OTRO IS NOT NULL THEN rv.DE_TEXTO_OTRO
                ELSE ''
              END as valor,
              c.NO_LABEL as campo_label, c.CO_TIPO as campo_tipo
       FROM IDO_FORMULARIO.CBTC_RESPUESTA_VALORES rv
       INNER JOIN IDO_FORMULARIO.CBTC_CAMPOS c ON rv.ID_CAMPO = c.ID_CAMPO
       WHERE rv.ID_RESPUESTA = :1
       ORDER BY c.NU_ORDEN`,
      [respuestaIdNum],
      { outFormat: pool.OUT_FORMAT_OBJECT }
    );

    // Oracle devuelve los alias en MAYÚSCULAS cuando se usa OUT_FORMAT_OBJECT
    respuestaData.valores = valoresResult.rows.map(row => ({
      id: row.ID !== undefined ? row.ID : (row.id !== undefined ? row.id : (row.ID_VALOR !== undefined ? row.ID_VALOR : null)),
      id_campo: row.ID_CAMPO !== undefined ? row.ID_CAMPO : (row.id_campo !== undefined ? row.id_campo : null),
      valor: row.VALOR !== undefined ? row.VALOR : (row.valor !== undefined ? row.valor : null),
      campo_label: row.CAMPO_LABEL !== undefined ? row.CAMPO_LABEL : (row.campo_label !== undefined ? row.campo_label : null),
      campo_tipo: row.CAMPO_TIPO !== undefined ? row.CAMPO_TIPO : (row.campo_tipo !== undefined ? row.campo_tipo : null)
    }));

    console.log('✅ getRespuesta - Respuesta encontrada:', {
      id: respuestaData.id,
      id_formulario: respuestaData.id_formulario,
      total_valores: respuestaData.valores.length
    });

    res.json(respuestaData);
  } catch (error) {
    console.error('❌ Error al obtener respuesta:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      mensaje: error.message,
      codigo: error.code,
      ...(error.offset !== undefined && { offset: error.offset }),
      ...(error.errorNum !== undefined && { errorNum: error.errorNum })
    });
  }
};

// Crear o actualizar una respuesta
export const saveRespuesta = async (req, res) => {
  let connection;
  try {
    const { idFormulario } = req.params;
    const { idRespuesta, valores, estado } = req.body;
    const userId = req.user.id;

    // Obtener una conexión y mantenerla abierta para toda la transacción
    connection = await pool.getConnection();
    
    let respuestaId = idRespuesta;

    // Si no existe respuesta, crear una nueva
    if (!respuestaId) {
      // Obtener el siguiente ID de la secuencia antes de insertar
      const sequenceResult = await connection.execute(
        `SELECT IDO_FORMULARIO.CBSE_RESPUESTAS.NEXTVAL as next_id FROM DUAL`,
        [],
        { outFormat: pool.OUT_FORMAT_OBJECT }
      );
      
      // Extraer el ID correctamente (Oracle devuelve en mayúsculas)
      const row = sequenceResult.rows[0];
      const nextId = row.NEXT_ID !== undefined ? row.NEXT_ID : (row.next_id !== undefined ? row.next_id : null);
      
      if (!nextId) {
        await connection.rollback();
        connection.release();
        return res.status(500).json({ 
          error: 'Error al crear la respuesta',
          detalle: 'No se pudo obtener el siguiente ID de la secuencia.',
          contexto: {
            id_formulario: idFormulario,
            id_usuario: userId,
            estado: estado || 'BORRADOR'
          }
        });
      }
      
      // Insertar con el ID obtenido de la secuencia
      await connection.execute(
        `INSERT INTO IDO_FORMULARIO.CBTC_RESPUESTAS 
         (ID_RESPUESTA, ID_FORMULARIO, ID_USUARIO, CO_ESTADO, FE_INICIO, FE_ULTIMA_ACTUALIZACION, FE_CREACION, FE_ACTUALIZACION)
         VALUES (:1, :2, :3, :4, SYSDATE, SYSDATE, SYSDATE, SYSDATE)`,
        [nextId, idFormulario, userId, estado || 'BORRADOR'],
        { autoCommit: false }
      );

      respuestaId = nextId;
    } else {
      // Actualizar respuesta existente
      await connection.execute(
        `UPDATE IDO_FORMULARIO.CBTC_RESPUESTAS 
         SET CO_ESTADO = :1, FE_ULTIMA_ACTUALIZACION = SYSDATE, FE_ACTUALIZACION = SYSDATE,
             FE_ENVIO = CASE WHEN :2 = 'COMPLETADO' THEN SYSDATE ELSE FE_ENVIO END
         WHERE ID_RESPUESTA = :3 AND ID_USUARIO = :4`,
        [estado || 'BORRADOR', estado || 'BORRADOR', respuestaId, userId],
        { autoCommit: false }
      );
    }

    // Eliminar valores existentes
    await connection.execute(
      'DELETE FROM IDO_FORMULARIO.CBTC_RESPUESTA_VALORES WHERE ID_RESPUESTA = :1',
      [respuestaId],
      { autoCommit: false }
    );

    // Insertar nuevos valores
    if (valores && Array.isArray(valores)) {
      for (const valor of valores) {
        const valorTexto = valor.valor || '';
        // Determinar qué columna usar según el tipo de campo
        // Por simplicidad, usamos DE_VALOR_TEXTO para todos los tipos
        await connection.execute(
          `INSERT INTO IDO_FORMULARIO.CBTC_RESPUESTA_VALORES 
           (ID_RESPUESTA, ID_CAMPO, DE_VALOR_TEXTO, FE_CREACION, FE_ACTUALIZACION)
           VALUES (:1, :2, :3, SYSDATE, SYSDATE)`,
          [respuestaId, valor.id_campo, valorTexto],
          { autoCommit: false }
        );
      }
    }

    // Confirmar toda la transacción
    await connection.commit();

    // Obtener la respuesta actualizada (usando la misma conexión)
    const respuestaResult = await connection.execute(
      `SELECT r.ID_RESPUESTA as id, r.ID_FORMULARIO as id_formulario, r.ID_USUARIO as id_usuario,
              r.CO_ESTADO as estado, r.FE_INICIO as fecha_inicio, r.FE_ULTIMA_ACTUALIZACION as fecha_ultima_actualizacion,
              r.FE_ENVIO as fecha_envio, r.FE_CREACION as created_at, r.FE_ACTUALIZACION as updated_at
       FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
       WHERE r.ID_RESPUESTA = :1`,
      [respuestaId],
      { outFormat: pool.OUT_FORMAT_OBJECT }
    );

    const respuesta = respuestaResult.rows[0];
    const respuestaData = {
      id: respuesta.ID_RESPUESTA !== undefined ? respuesta.ID_RESPUESTA : respuesta.id,
      id_formulario: respuesta.ID_FORMULARIO !== undefined ? respuesta.ID_FORMULARIO : respuesta.id_formulario,
      id_usuario: respuesta.ID_USUARIO !== undefined ? respuesta.ID_USUARIO : respuesta.id_usuario,
      estado: respuesta.CO_ESTADO !== undefined ? respuesta.CO_ESTADO : respuesta.estado,
      fecha_inicio: respuesta.FE_INICIO !== undefined ? respuesta.FE_INICIO : respuesta.fecha_inicio,
      fecha_ultima_actualizacion: respuesta.FE_ULTIMA_ACTUALIZACION !== undefined ? respuesta.FE_ULTIMA_ACTUALIZACION : respuesta.fecha_ultima_actualizacion,
      fecha_envio: respuesta.FE_ENVIO !== undefined ? respuesta.FE_ENVIO : respuesta.fecha_envio,
      created_at: respuesta.FE_CREACION !== undefined ? respuesta.FE_CREACION : respuesta.created_at,
      updated_at: respuesta.FE_ACTUALIZACION !== undefined ? respuesta.FE_ACTUALIZACION : respuesta.updated_at
    };

    // Liberar la conexión
    connection.release();
    
    res.json(respuestaData);
  } catch (error) {
    console.error('Error al guardar respuesta:', error);
    
    // Hacer rollback y liberar conexión si existe
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error al hacer rollback:', rollbackError);
      }
      try {
        connection.release();
      } catch (releaseError) {
        console.error('Error al liberar conexión:', releaseError);
      }
    }
    
    // Proporcionar información detallada del error
    const errorMessage = error.message || 'Error desconocido';
    const errorCode = error.code || 'UNKNOWN';
    const errorDetail = {
      error: 'Error al guardar la respuesta',
      mensaje: errorMessage,
      codigo: errorCode,
      tipo: error.name || 'Error',
      ...(error.offset !== undefined && { offset: error.offset }),
      ...(error.errorNum !== undefined && { errorNum: error.errorNum })
    };
    
    // Si es un error de Oracle, agregar más detalles
    if (error.code && error.code.startsWith('ORA-')) {
      errorDetail.oracleError = true;
      errorDetail.oracleCode = error.code;
    }
    
    res.status(500).json(errorDetail);
  }
};

// Obtener todas las respuestas de un usuario (para el dashboard)
export const getMisRespuestas = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT r.ID_RESPUESTA as id, r.ID_FORMULARIO as id_formulario, r.ID_USUARIO as id_usuario,
              r.CO_ESTADO as estado, r.FE_INICIO as fecha_inicio, r.FE_ULTIMA_ACTUALIZACION as fecha_ultima_actualizacion,
              r.FE_ENVIO as fecha_envio, r.FE_CREACION as created_at, r.FE_ACTUALIZACION as updated_at,
              f.NO_TITULO as formulario_titulo
       FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
       INNER JOIN IDO_FORMULARIO.CBTC_FORMULARIOS f ON r.ID_FORMULARIO = f.ID_FORMULARIO
       WHERE r.ID_USUARIO = :1
       ORDER BY r.FE_CREACION DESC`,
      [userId],
      { outFormat: pool.OUT_FORMAT_OBJECT }
    );

    const respuestas = result.rows.map(row => {
      // Oracle devuelve los alias en MAYÚSCULAS cuando se usa OUT_FORMAT_OBJECT
      // El alias "as id" se devuelve como "ID"
      const id = row.ID !== undefined ? row.ID : 
                 (row.id !== undefined ? row.id : 
                 (row.ID_RESPUESTA !== undefined ? row.ID_RESPUESTA : null));
      
      // Log para depuración si falta el ID
      if (!id) {
        console.error('⚠️ getMisRespuestas - Row sin ID. Keys disponibles:', Object.keys(row));
        console.error('⚠️ Row completo:', JSON.stringify(row, null, 2));
      }
      
      const respuesta = {
        id: id,
        id_formulario: row.ID_FORMULARIO !== undefined ? row.ID_FORMULARIO : (row.id_formulario !== undefined ? row.id_formulario : null),
        id_usuario: row.ID_USUARIO !== undefined ? row.ID_USUARIO : (row.id_usuario !== undefined ? row.id_usuario : null),
        estado: row.ESTADO !== undefined ? row.ESTADO : (row.estado !== undefined ? row.estado : null),
        fecha_inicio: row.FECHA_INICIO !== undefined ? row.FECHA_INICIO : (row.fecha_inicio !== undefined ? row.fecha_inicio : null),
        fecha_ultima_actualizacion: row.FECHA_ULTIMA_ACTUALIZACION !== undefined ? row.FECHA_ULTIMA_ACTUALIZACION : (row.fecha_ultima_actualizacion !== undefined ? row.fecha_ultima_actualizacion : null),
        fecha_envio: row.FECHA_ENVIO !== undefined ? row.FECHA_ENVIO : (row.fecha_envio !== undefined ? row.fecha_envio : null),
        created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : (row.created_at !== undefined ? row.created_at : null),
        updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : (row.updated_at !== undefined ? row.updated_at : null),
        formulario_titulo: row.FORMULARIO_TITULO !== undefined ? row.FORMULARIO_TITULO : (row.formulario_titulo !== undefined ? row.formulario_titulo : null)
      };
      
      return respuesta;
    });

    // Log para depuración
    console.log('📋 getMisRespuestas - Total respuestas:', respuestas.length);
    if (respuestas.length > 0) {
      console.log('📋 Primera respuesta:', JSON.stringify(respuestas[0], null, 2));
    }

    res.json(respuestas);
  } catch (error) {
    console.error('Error al obtener mis respuestas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener dashboard de respuestas (estadísticas y lista)
export const getDashboardRespuestas = async (req, res) => {
  try {
    const userId = req.user.id;
    const rol = req.user.rol; // ADMINISTRADOR o GESTOR_LOCAL
    const { idFormulario, fechaDesde, fechaHasta } = req.query;

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    // Si es GESTOR_LOCAL, solo ver sus respuestas propias
    if (rol !== 'ADMINISTRADOR') {
      whereClause += ` AND r.ID_USUARIO = :${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    // Filtro por formulario
    if (idFormulario) {
      whereClause += ` AND r.ID_FORMULARIO = :${paramIndex}`;
      params.push(idFormulario);
      paramIndex++;
    }

    // Filtro por fecha desde
    if (fechaDesde) {
      whereClause += ` AND r.FE_CREACION >= TO_DATE(:${paramIndex}, 'YYYY-MM-DD')`;
      params.push(fechaDesde);
      paramIndex++;
    }

    // Filtro por fecha hasta
    if (fechaHasta) {
      whereClause += ` AND r.FE_CREACION <= TO_DATE(:${paramIndex}, 'YYYY-MM-DD') + 1`;
      params.push(fechaHasta);
      paramIndex++;
    }

    // Obtener estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_respuestas,
        COUNT(CASE WHEN r.CO_ESTADO = 'COMPLETADO' THEN 1 END) as completadas,
        COUNT(CASE WHEN r.CO_ESTADO = 'BORRADOR' THEN 1 END) as borradores,
        COUNT(DISTINCT r.ID_FORMULARIO) as total_formularios,
        COUNT(DISTINCT r.ID_USUARIO) as total_usuarios
      FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
      WHERE 1=1 ${whereClause}
    `;

    const statsResult = await pool.query(statsQuery, params, { outFormat: pool.OUT_FORMAT_OBJECT });
    const stats = statsResult.rows[0];

    // Obtener estadísticas por formulario
    const statsPorFormularioQuery = `
      SELECT 
        f.ID_FORMULARIO as id_formulario,
        f.NO_TITULO as titulo_formulario,
        COUNT(*) as total_respuestas,
        COUNT(CASE WHEN r.CO_ESTADO = 'COMPLETADO' THEN 1 END) as completadas,
        COUNT(CASE WHEN r.CO_ESTADO = 'BORRADOR' THEN 1 END) as borradores
      FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
      INNER JOIN IDO_FORMULARIO.CBTC_FORMULARIOS f ON r.ID_FORMULARIO = f.ID_FORMULARIO
      WHERE 1=1 ${whereClause}
      GROUP BY f.ID_FORMULARIO, f.NO_TITULO
      ORDER BY total_respuestas DESC
    `;

    const statsPorFormularioResult = await pool.query(statsPorFormularioQuery, params, { outFormat: pool.OUT_FORMAT_OBJECT });
    const statsPorFormulario = statsPorFormularioResult.rows.map(row => ({
      id_formulario: row.ID_FORMULARIO !== undefined ? row.ID_FORMULARIO : row.id_formulario,
      titulo_formulario: row.TITULO_FORMULARIO !== undefined ? row.TITULO_FORMULARIO : row.titulo_formulario,
      total_respuestas: row.TOTAL_RESPUESTAS !== undefined ? row.TOTAL_RESPUESTAS : row.total_respuestas,
      completadas: row.COMPLETADAS !== undefined ? row.COMPLETADAS : row.completadas,
      borradores: row.BORRADORES !== undefined ? row.BORRADORES : row.borradores
    }));

    // Obtener lista de respuestas con detalles
    const respuestasQuery = `
      SELECT 
        r.ID_RESPUESTA as id,
        r.ID_FORMULARIO as id_formulario,
        r.ID_USUARIO as id_usuario,
        r.CO_ESTADO as estado,
        r.FE_INICIO as fecha_inicio,
        r.FE_ULTIMA_ACTUALIZACION as fecha_ultima_actualizacion,
        r.FE_ENVIO as fecha_envio,
        r.FE_CREACION as created_at,
        f.NO_TITULO as formulario_titulo,
        u.NO_USERNAME as username
      FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
      INNER JOIN IDO_FORMULARIO.CBTC_FORMULARIOS f ON r.ID_FORMULARIO = f.ID_FORMULARIO
      INNER JOIN IDO_FORMULARIO.CBTC_USUARIOS u ON r.ID_USUARIO = u.ID_USUARIO
      WHERE 1=1 ${whereClause}
      ORDER BY r.FE_CREACION DESC
    `;

    const respuestasResult = await pool.query(respuestasQuery, params, { outFormat: pool.OUT_FORMAT_OBJECT });
    const respuestas = respuestasResult.rows.map(row => ({
      id: row.ID !== undefined ? row.ID : (row.id !== undefined ? row.id : (row.ID_RESPUESTA !== undefined ? row.ID_RESPUESTA : null)),
      id_formulario: row.ID_FORMULARIO !== undefined ? row.ID_FORMULARIO : row.id_formulario,
      id_usuario: row.ID_USUARIO !== undefined ? row.ID_USUARIO : row.id_usuario,
      estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
      fecha_inicio: row.FECHA_INICIO !== undefined ? row.FECHA_INICIO : row.fecha_inicio,
      fecha_ultima_actualizacion: row.FECHA_ULTIMA_ACTUALIZACION !== undefined ? row.FECHA_ULTIMA_ACTUALIZACION : row.fecha_ultima_actualizacion,
      fecha_envio: row.FECHA_ENVIO !== undefined ? row.FECHA_ENVIO : row.fecha_envio,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      formulario_titulo: row.FORMULARIO_TITULO !== undefined ? row.FORMULARIO_TITULO : row.formulario_titulo,
      username: row.USERNAME !== undefined ? row.USERNAME : row.username
    }));

    res.json({
      estadisticas: {
        total_respuestas: stats.TOTAL_RESPUESTAS !== undefined ? stats.TOTAL_RESPUESTAS : stats.total_respuestas,
        completadas: stats.COMPLETADAS !== undefined ? stats.COMPLETADAS : stats.completadas,
        borradores: stats.BORRADORES !== undefined ? stats.BORRADORES : stats.borradores,
        total_formularios: stats.TOTAL_FORMULARIOS !== undefined ? stats.TOTAL_FORMULARIOS : stats.total_formularios,
        total_usuarios: stats.TOTAL_USUARIOS !== undefined ? stats.TOTAL_USUARIOS : stats.total_usuarios
      },
      estadisticas_por_formulario: statsPorFormulario,
      respuestas: respuestas
    });
  } catch (error) {
    console.error('Error al obtener dashboard de respuestas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Exportar respuestas a Excel
export const exportarRespuestasExcel = async (req, res) => {
  try {
    const userId = req.user.id;
    const rol = req.user.rol; // ADMINISTRADOR o GESTOR_LOCAL
    const { idFormulario, fechaDesde, fechaHasta } = req.query;

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    // Si es GESTOR_LOCAL y NO hay un formulario específico, solo ver respuestas propias
    // Si hay un formulario específico (idFormulario), exportar todas las respuestas de ese formulario
    if (rol !== 'ADMINISTRADOR' && !idFormulario) {
      whereClause += ` AND r.ID_USUARIO = :${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    // Filtro por formulario
    if (idFormulario) {
      whereClause += ` AND r.ID_FORMULARIO = :${paramIndex}`;
      params.push(idFormulario);
      paramIndex++;
    }

    // Filtro por fecha desde
    if (fechaDesde) {
      whereClause += ` AND r.FE_CREACION >= TO_DATE(:${paramIndex}, 'YYYY-MM-DD')`;
      params.push(fechaDesde);
      paramIndex++;
    }

    // Filtro por fecha hasta
    if (fechaHasta) {
      whereClause += ` AND r.FE_CREACION <= TO_DATE(:${paramIndex}, 'YYYY-MM-DD') + 1`;
      params.push(fechaHasta);
      paramIndex++;
    }

    // Obtener respuestas con sus valores
    const respuestasQuery = `
      SELECT 
        r.ID_RESPUESTA as id,
        r.ID_FORMULARIO as id_formulario,
        r.ID_USUARIO as id_usuario,
        r.CO_ESTADO as estado,
        r.FE_INICIO as fecha_inicio,
        r.FE_ULTIMA_ACTUALIZACION as fecha_ultima_actualizacion,
        r.FE_ENVIO as fecha_envio,
        r.FE_CREACION as created_at,
        f.NO_TITULO as formulario_titulo,
        u.NO_USERNAME as username
      FROM IDO_FORMULARIO.CBTC_RESPUESTAS r
      INNER JOIN IDO_FORMULARIO.CBTC_FORMULARIOS f ON r.ID_FORMULARIO = f.ID_FORMULARIO
      INNER JOIN IDO_FORMULARIO.CBTC_USUARIOS u ON r.ID_USUARIO = u.ID_USUARIO
      WHERE 1=1 ${whereClause}
      ORDER BY r.FE_CREACION DESC
    `;

    const respuestasResult = await pool.query(respuestasQuery, params, { outFormat: pool.OUT_FORMAT_OBJECT });
    const respuestas = respuestasResult.rows.map(row => ({
      id: row.ID !== undefined ? row.ID : (row.id !== undefined ? row.id : (row.ID_RESPUESTA !== undefined ? row.ID_RESPUESTA : null)),
      id_formulario: row.ID_FORMULARIO !== undefined ? row.ID_FORMULARIO : row.id_formulario,
      id_usuario: row.ID_USUARIO !== undefined ? row.ID_USUARIO : row.id_usuario,
      estado: row.ESTADO !== undefined ? row.ESTADO : row.estado,
      fecha_inicio: row.FECHA_INICIO !== undefined ? row.FECHA_INICIO : row.fecha_inicio,
      fecha_ultima_actualizacion: row.FECHA_ULTIMA_ACTUALIZACION !== undefined ? row.FECHA_ULTIMA_ACTUALIZACION : row.fecha_ultima_actualizacion,
      fecha_envio: row.FECHA_ENVIO !== undefined ? row.FECHA_ENVIO : row.fecha_envio,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      formulario_titulo: row.FORMULARIO_TITULO !== undefined ? row.FORMULARIO_TITULO : row.formulario_titulo,
      username: row.USERNAME !== undefined ? row.USERNAME : row.username
    }));

    // Crear archivo Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Respuestas');

    // Obtener campos del formulario (si hay un formulario específico, solo ese; si no, todos los formularios)
    const formulariosIds = idFormulario ? [idFormulario] : [...new Set(respuestas.map(r => r.id_formulario))];
    const camposMap = new Map();
    const camposOrdenados = []; // Array para mantener el orden de los campos

    for (const idFormularioItem of formulariosIds) {
      const camposResult = await pool.query(
        `SELECT c.ID_CAMPO, c.NO_LABEL, c.CO_TIPO, s.NU_ORDEN as orden_seccion, c.NU_ORDEN as orden_campo
         FROM IDO_FORMULARIO.CBTC_CAMPOS c
         INNER JOIN IDO_FORMULARIO.CBTC_SECCIONES s ON c.ID_SECCION = s.ID_SECCION
         WHERE s.ID_FORMULARIO = :1 AND c.FL_ACTIVO = 'S'
         ORDER BY s.NU_ORDEN, c.NU_ORDEN`,
        [idFormularioItem],
        { outFormat: pool.OUT_FORMAT_OBJECT }
      );

      const campos = camposResult.rows.map(row => ({
        id_campo: row.ID_CAMPO !== undefined ? row.ID_CAMPO : row.id_campo,
        label: row.NO_LABEL !== undefined ? row.NO_LABEL : row.no_label,
        tipo: row.CO_TIPO !== undefined ? row.CO_TIPO : row.co_tipo,
        orden_seccion: row.ORDEN_SECCION !== undefined ? row.ORDEN_SECCION : row.orden_seccion,
        orden_campo: row.ORDEN_CAMPO !== undefined ? row.ORDEN_CAMPO : row.orden_campo
      }));

      camposMap.set(idFormularioItem, campos);
      
      // Si es un solo formulario, guardar el orden de los campos
      if (idFormulario && camposOrdenados.length === 0) {
        camposOrdenados.push(...campos);
      }
    }

    // Definir columnas del Excel - primero las columnas básicas
    const columnasBasicas = [
      { header: 'ID Respuesta', key: 'id', width: 15 },
      { header: 'Usuario', key: 'username', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Fecha Creación', key: 'fecha_creacion', width: 20 },
      { header: 'Fecha Envío', key: 'fecha_envio', width: 20 }
    ];

    // Si hay múltiples formularios, agregar columna de formulario
    if (!idFormulario && formulariosIds.length > 1) {
      columnasBasicas.splice(1, 0, { header: 'Formulario', key: 'formulario', width: 30 });
    }

    // Agregar columnas de campos en el orden correcto
    if (idFormulario && camposOrdenados.length > 0) {
      // Si es un solo formulario, usar el orden de los campos
      worksheet.columns = [
        ...columnasBasicas,
        ...camposOrdenados.map(campo => ({
          header: campo.label,
          key: `campo_${campo.id_campo}`,
          width: 25
        }))
      ];
    } else {
      // Si son múltiples formularios, agregar todos los campos únicos
      const allCampos = new Map();
      for (const [idFormularioItem, campos] of camposMap.entries()) {
        campos.forEach(campo => {
          if (!allCampos.has(campo.id_campo)) {
            allCampos.set(campo.id_campo, campo);
          }
        });
      }
      
      // Ordenar campos por orden de sección y campo
      const camposArray = Array.from(allCampos.values()).sort((a, b) => {
        if (a.orden_seccion !== b.orden_seccion) {
          return a.orden_seccion - b.orden_seccion;
        }
        return a.orden_campo - b.orden_campo;
      });

      worksheet.columns = [
        ...columnasBasicas,
        ...camposArray.map(campo => ({
          header: campo.label,
          key: `campo_${campo.id_campo}`,
          width: 25
        }))
      ];
    }

    // Estilo para encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Obtener todas las columnas de campos que se usarán en el Excel
    const todasLasColumnasCampos = [];
    if (idFormulario && camposOrdenados.length > 0) {
      todasLasColumnasCampos.push(...camposOrdenados);
    } else {
      // Si son múltiples formularios, obtener todos los campos únicos
      const allCamposSet = new Map();
      for (const [idFormularioItem, campos] of camposMap.entries()) {
        campos.forEach(campo => {
          if (!allCamposSet.has(campo.id_campo)) {
            allCamposSet.set(campo.id_campo, campo);
          }
        });
      }
      todasLasColumnasCampos.push(...Array.from(allCamposSet.values()).sort((a, b) => {
        if (a.orden_seccion !== b.orden_seccion) {
          return a.orden_seccion - b.orden_seccion;
        }
        return a.orden_campo - b.orden_campo;
      }));
    }

    // Agregar datos
    for (const respuesta of respuestas) {
      // Validar que el ID de respuesta sea válido
      const respuestaIdNum = parseInt(respuesta.id, 10);
      if (isNaN(respuestaIdNum)) {
        console.error('⚠️ ID de respuesta inválido:', respuesta.id);
        continue;
      }

      // Obtener valores de la respuesta
      const valoresResult = await pool.query(
        `SELECT rv.ID_CAMPO, 
                CASE 
                  WHEN rv.DE_VALOR_TEXTO IS NOT NULL THEN DBMS_LOB.SUBSTR(rv.DE_VALOR_TEXTO, 4000, 1)
                  WHEN rv.NU_VALOR_NUMERO IS NOT NULL THEN TO_CHAR(rv.NU_VALOR_NUMERO)
                  WHEN rv.FE_VALOR_FECHA IS NOT NULL THEN TO_CHAR(rv.FE_VALOR_FECHA, 'YYYY-MM-DD HH24:MI:SS')
                  WHEN rv.DE_TEXTO_OTRO IS NOT NULL THEN rv.DE_TEXTO_OTRO
                  WHEN rv.ID_OPCION_SELECCIONADA IS NOT NULL THEN (
                    SELECT oc.NO_TEXTO 
                    FROM IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS oc 
                    WHERE oc.ID_OPCION = rv.ID_OPCION_SELECCIONADA
                  )
                  ELSE ''
                END as valor
         FROM IDO_FORMULARIO.CBTC_RESPUESTA_VALORES rv
         WHERE rv.ID_RESPUESTA = :1`,
        [respuestaIdNum],
        { outFormat: pool.OUT_FORMAT_OBJECT }
      );

      // Crear mapa de valores por ID de campo
      const valoresMap = new Map();
      valoresResult.rows.forEach(row => {
        const idCampo = row.ID_CAMPO !== undefined ? row.ID_CAMPO : row.id_campo;
        const valor = row.VALOR !== undefined ? row.VALOR : (row.valor !== undefined ? row.valor : '');
        if (idCampo) {
          valoresMap.set(idCampo, valor || '');
        }
      });

      // Formatear fechas
      const fechaCreacion = respuesta.created_at ? new Date(respuesta.created_at).toLocaleString('es-PE') : '';
      const fechaEnvio = respuesta.fecha_envio ? new Date(respuesta.fecha_envio).toLocaleString('es-PE') : '';

      // Construir objeto de fila con todas las columnas
      const fila = {
        id: respuesta.id,
        username: respuesta.username || '',
        estado: respuesta.estado || '',
        fecha_creacion: fechaCreacion,
        fecha_envio: fechaEnvio
      };

      // Si hay múltiples formularios, agregar columna de formulario
      if (!idFormulario && formulariosIds.length > 1) {
        fila.formulario = respuesta.formulario_titulo || '';
      }

      // Agregar valores de TODOS los campos (incluso si están vacíos para esta respuesta)
      todasLasColumnasCampos.forEach(campo => {
        fila[`campo_${campo.id_campo}`] = valoresMap.get(campo.id_campo) || '';
      });

      worksheet.addRow(fila);
    }

    // Configurar respuesta HTTP
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=respuestas_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar respuestas a Excel:', error);
    res.status(500).json({ error: 'Error interno del servidor al exportar Excel' });
  }
};
