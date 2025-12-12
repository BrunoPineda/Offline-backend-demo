import pool from '../config/database.js';

// Validación de producto
export const validateProduct = (nombre, precio, cantidad) => {
  const errors = [];

  if (!nombre || nombre.trim().length === 0) {
    errors.push('El nombre es requerido');
  }
  if (nombre && nombre.length > 30) {
    errors.push('El nombre no puede exceder 30 caracteres');
  }
  if (precio === undefined || precio === null) {
    errors.push('El precio es requerido');
  }
  if (precio < 0) {
    errors.push('El precio no puede ser negativo');
  }
  if (cantidad === undefined || cantidad === null) {
    errors.push('La cantidad es requerida');
  }
  if (cantidad < 0) {
    errors.push('La cantidad no puede ser negativa');
  }

  return errors;
};

// Crear nuevo producto
export const createProducto = async (req, res) => {
  try {
    const { nombre, precio, cantidad } = req.body;

    const validationErrors = validateProduct(nombre, precio, cantidad);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Insertar producto
    await pool.query(
      'INSERT INTO IDO_FORMULARIO.CBTC_PRODUCTOS (NO_PRODUCTO, ME_PRECIO, CA_CANTIDAD, FE_CREACION, FE_ACTUALIZACION) VALUES (:1, :2, :3, SYSDATE, SYSDATE)',
      [nombre.trim(), precio, cantidad],
      { autoCommit: true }
    );

    // Obtener el producto recién creado usando el nombre y la fecha más reciente
    const result = await pool.query(
      `SELECT ID_PRODUCTO as id, NO_PRODUCTO as nombre, ME_PRECIO as precio, CA_CANTIDAD as cantidad, 
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM (
         SELECT ID_PRODUCTO, NO_PRODUCTO, ME_PRECIO, CA_CANTIDAD, FE_CREACION, FE_ACTUALIZACION
         FROM IDO_FORMULARIO.CBTC_PRODUCTOS 
         WHERE NO_PRODUCTO = :1
         ORDER BY FE_CREACION DESC
       ) WHERE ROWNUM = 1`,
      [nombre.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(500).json({ error: 'Error al obtener el producto creado' });
    }

    // Normalizar nombres de columnas (Oracle devuelve en mayúsculas)
    const row = result.rows[0];
    const producto = {
      id: row.ID !== undefined ? row.ID : row.id,
      nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
      precio: row.PRECIO !== undefined ? row.PRECIO : row.precio,
      cantidad: row.CANTIDAD !== undefined ? row.CANTIDAD : row.cantidad,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at
    };
    
    // Emitir evento Socket.io
    req.io.emit('producto_creado', producto);
    req.io.emit('producto_actualizado', producto);

    res.status(201).json(producto);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener un producto por ID
export const getProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT ID_PRODUCTO as id, NO_PRODUCTO as nombre, ME_PRECIO as precio, CA_CANTIDAD as cantidad, FE_CREACION as created_at, FE_ACTUALIZACION as updated_at FROM IDO_FORMULARIO.CBTC_PRODUCTOS WHERE ID_PRODUCTO = :1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Normalizar nombres de columnas (Oracle devuelve en mayúsculas)
    const row = result.rows[0];
    const producto = {
      id: row.ID !== undefined ? row.ID : row.id,
      nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
      precio: row.PRECIO !== undefined ? row.PRECIO : row.precio,
      cantidad: row.CANTIDAD !== undefined ? row.CANTIDAD : row.cantidad,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at
    };

    res.json(producto);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener productos con paginación
export const getProductos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const lastSync = req.query.last_sync; // Fecha de última sincronización (ISO string)
    
    let whereClause = '';
    let queryParams = [];
    
    // Si hay fecha de última sincronización, filtrar solo productos actualizados después
    if (lastSync) {
      try {
        // Convertir fecha ISO a formato Oracle DATE
        const lastSyncDate = new Date(lastSync);
        // Formato: YYYY-MM-DD HH24:MI:SS
        const oracleDate = lastSyncDate.toISOString().replace('T', ' ').substring(0, 19);
        whereClause = 'WHERE (FE_ACTUALIZACION > TO_DATE(:1, \'YYYY-MM-DD HH24:MI:SS\') OR FE_CREACION > TO_DATE(:1, \'YYYY-MM-DD HH24:MI:SS\'))';
        queryParams.push(oracleDate);
        console.log('🔄 Sincronización incremental desde:', lastSync, '->', oracleDate);
      } catch (e) {
        console.warn('⚠️ Error al parsear fecha last_sync, usando sincronización completa:', e);
      }
    }
    
    // Obtener total de productos (con filtro si aplica)
    const countQuery = `SELECT COUNT(*) as total FROM IDO_FORMULARIO.CBTC_PRODUCTOS ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].TOTAL);
    
    // Obtener productos paginados
    const result = await pool.query(
      `SELECT ID_PRODUCTO as id, NO_PRODUCTO as nombre, ME_PRECIO as precio, CA_CANTIDAD as cantidad, 
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM IDO_FORMULARIO.CBTC_PRODUCTOS 
       ${whereClause}
       ORDER BY FE_CREACION DESC 
       OFFSET :${queryParams.length + 1} ROWS FETCH NEXT :${queryParams.length + 2} ROWS ONLY`,
      [...queryParams, offset, limit]
    );

    // Normalizar nombres de columnas (Oracle devuelve en mayúsculas)
    const data = result.rows.map(producto => ({
      id: producto.ID !== undefined ? producto.ID : producto.id,
      nombre: producto.NOMBRE !== undefined ? producto.NOMBRE : producto.nombre,
      precio: producto.PRECIO !== undefined ? producto.PRECIO : producto.precio,
      cantidad: producto.CANTIDAD !== undefined ? producto.CANTIDAD : producto.cantidad,
      created_at: producto.CREATED_AT !== undefined ? producto.CREATED_AT : producto.created_at,
      updated_at: producto.UPDATED_AT !== undefined ? producto.UPDATED_AT : producto.updated_at
    }));

    res.json({
      data: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      last_sync: lastSync || null,
      sync_type: lastSync ? 'incremental' : 'full'
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar producto
export const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, cantidad } = req.body;

    const validationErrors = validateProduct(nombre, precio, cantidad);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Actualizar producto (el trigger actualizará FE_ACTUALIZACION automáticamente)
    await pool.query(
      'UPDATE IDO_FORMULARIO.CBTC_PRODUCTOS SET NO_PRODUCTO = :1, ME_PRECIO = :2, CA_CANTIDAD = :3 WHERE ID_PRODUCTO = :4',
      [nombre.trim(), precio, cantidad, id],
      { autoCommit: true }
    );

    // Obtener el producto actualizado
    const result = await pool.query(
      'SELECT ID_PRODUCTO as id, NO_PRODUCTO as nombre, ME_PRECIO as precio, CA_CANTIDAD as cantidad, FE_CREACION as created_at, FE_ACTUALIZACION as updated_at FROM IDO_FORMULARIO.CBTC_PRODUCTOS WHERE ID_PRODUCTO = :1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Normalizar nombres de columnas (Oracle devuelve en mayúsculas)
    const row = result.rows[0];
    const producto = {
      id: row.ID !== undefined ? row.ID : row.id,
      nombre: row.NOMBRE !== undefined ? row.NOMBRE : row.nombre,
      precio: row.PRECIO !== undefined ? row.PRECIO : row.precio,
      cantidad: row.CANTIDAD !== undefined ? row.CANTIDAD : row.cantidad,
      created_at: row.CREATED_AT !== undefined ? row.CREATED_AT : row.created_at,
      updated_at: row.UPDATED_AT !== undefined ? row.UPDATED_AT : row.updated_at
    };
    
    // Emitir evento Socket.io
    req.io.emit('producto_actualizado', producto);

    res.json(producto);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Eliminar producto
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el producto antes de eliminarlo
    const getProduct = await pool.query(
      'SELECT ID_PRODUCTO as id FROM IDO_FORMULARIO.CBTC_PRODUCTOS WHERE ID_PRODUCTO = :1',
      [id]
    );

    if (getProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar producto
    await pool.query(
      'DELETE FROM IDO_FORMULARIO.CBTC_PRODUCTOS WHERE ID_PRODUCTO = :1',
      [id],
      { autoCommit: true }
    );

    // Emitir evento Socket.io
    req.io.emit('producto_eliminado', { id: parseInt(id) });

    res.json({ message: 'Producto eliminado correctamente', producto: { id: parseInt(id) } });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

