import pool from '../config/database.js';

// Sincronizar cambios
export const sync = async (req, res) => {
  try {
    const { lastSync } = req.body;
    const syncDate = lastSync ? new Date(lastSync) : new Date(0);

    // Obtener productos modificados desde la última sincronización
    const productosResult = await pool.query(
      `SELECT ID_PRODUCTO as id, NO_PRODUCTO as nombre, ME_PRECIO as precio, CA_CANTIDAD as cantidad, 
              FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
       FROM IDO_FORMULARIO.CBTC_PRODUCTOS 
       WHERE FE_ACTUALIZACION > :1 OR FE_CREACION > :1 
       ORDER BY FE_ACTUALIZACION DESC`,
      [syncDate]
    );

    // Obtener usuarios modificados desde la última sincronización
    const usuariosResult = await pool.query(
      `SELECT ID_USUARIO as id, NO_USERNAME as username, DI_CORREO as email, FE_CREACION as created_at 
       FROM IDO_FORMULARIO.CBTC_USUARIOS 
       WHERE FE_CREACION > :1 
       ORDER BY FE_CREACION DESC`,
      [syncDate]
    );

    res.json({
      productos: productosResult.rows,
      usuarios: usuariosResult.rows,
      syncTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en sincronización:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Enviar cambios del cliente al servidor
export const syncPush = async (req, res) => {
  try {
    const { productos, usuarios } = req.body;
    const resultados = {
      productos: [],
      usuarios: [],
      errores: []
    };

    // Sincronizar productos
    if (productos && Array.isArray(productos)) {
      for (const producto of productos) {
        try {
          if (producto.id && producto.id < 0) {
            // Nuevo producto (ID negativo indica creación local)
            await pool.query(
              'INSERT INTO IDO_FORMULARIO.CBTC_PRODUCTOS (NO_PRODUCTO, ME_PRECIO, CA_CANTIDAD, FE_CREACION, FE_ACTUALIZACION) VALUES (:1, :2, :3, SYSDATE, SYSDATE)',
              [producto.nombre, producto.precio, producto.cantidad],
              { autoCommit: true }
            );
            
            // Obtener el producto creado
            const newProduct = await pool.query(
              `SELECT ID_PRODUCTO as id, NO_PRODUCTO as nombre, ME_PRECIO as precio, CA_CANTIDAD as cantidad, 
                      FE_CREACION as created_at, FE_ACTUALIZACION as updated_at 
               FROM (
                 SELECT ID_PRODUCTO, NO_PRODUCTO, ME_PRECIO, CA_CANTIDAD, FE_CREACION, FE_ACTUALIZACION
                 FROM IDO_FORMULARIO.CBTC_PRODUCTOS 
                 WHERE NO_PRODUCTO = :1
                 ORDER BY FE_CREACION DESC
               ) WHERE ROWNUM = 1`,
              [producto.nombre]
            );
            
            if (newProduct.rows.length > 0) {
              resultados.productos.push(newProduct.rows[0]);
              req.io.emit('producto_creado', newProduct.rows[0]);
            }
          } else {
            // Actualizar producto existente
            await pool.query(
              'UPDATE IDO_FORMULARIO.CBTC_PRODUCTOS SET NO_PRODUCTO = :1, ME_PRECIO = :2, CA_CANTIDAD = :3 WHERE ID_PRODUCTO = :4',
              [producto.nombre, producto.precio, producto.cantidad, producto.id],
              { autoCommit: true }
            );
            
            // Obtener el producto actualizado
            const updatedProduct = await pool.query(
              'SELECT ID_PRODUCTO as id, NO_PRODUCTO as nombre, ME_PRECIO as precio, CA_CANTIDAD as cantidad, FE_CREACION as created_at, FE_ACTUALIZACION as updated_at FROM IDO_FORMULARIO.CBTC_PRODUCTOS WHERE ID_PRODUCTO = :1',
              [producto.id]
            );
            
            if (updatedProduct.rows.length > 0) {
              resultados.productos.push(updatedProduct.rows[0]);
              req.io.emit('producto_actualizado', updatedProduct.rows[0]);
            }
          }
        } catch (error) {
          resultados.errores.push({ producto, error: error.message });
        }
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error('Error en sincronización push:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

