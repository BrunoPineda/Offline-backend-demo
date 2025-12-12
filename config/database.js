import oracledb from 'oracledb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el directorio del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde el archivo .env en el directorio raíz del backend
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuración de Oracle
const dbConfig = {
  user: process.env.DB_USER || 'IDO_FORMULARIO',
  password: process.env.DB_PASSWORD || 'MFLstcIII4#',
  connectString: process.env.DB_CONNECTION_STRING || '192.168.125.181:1521/juntosdv',
  poolMin: parseInt(process.env.DB_POOL_MIN) || 1,
  poolMax: parseInt(process.env.DB_POOL_MAX) || 3,
  poolIncrement: parseInt(process.env.DB_POOL_INCREMENT) || 1,
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT) || 60,
  poolPingInterval: parseInt(process.env.DB_POOL_PING_INTERVAL) || 60
};

// Verificar que las variables de entorno estén disponibles
if (!process.env.DB_CONNECTION_STRING && !dbConfig.connectString) {
  console.error('❌ Error: DB_CONNECTION_STRING no está definida en las variables de entorno');
  console.error('   Asegúrate de tener un archivo .env en el directorio backend/ con la configuración de la base de datos');
  console.error('   Ruta esperada:', join(__dirname, '..', '.env'));
  process.exit(1);
}

console.log('📝 Configuración Oracle cargada:', {
  user: dbConfig.user,
  connectString: dbConfig.connectString.substring(0, 50) + '...'
});

// Crear pool de conexiones
let pool;

// Inicializar pool de conexiones
const initPool = async () => {
  try {
    // Configurar el modo de salida de resultados (para obtener objetos en lugar de arrays)
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    
    pool = await oracledb.createPool(dbConfig);
    console.log('✅ Pool de conexiones Oracle creado');
    
    // Probar la conexión
    const connection = await pool.getConnection();
    await connection.close();
    console.log('✅ Conectado a Oracle exitosamente');
    
    return pool;
  } catch (error) {
    console.error('❌ Error al crear pool de Oracle:', error);
    throw error;
  }
};

// Función para ejecutar consultas (similar a pool.query de pg)
const query = async (sql, binds = [], options = {}) => {
  // Asegurar que el pool esté inicializado
  await getPool();
  
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: options.autoCommit !== false, // Por defecto autoCommit es true
      ...options
    });
    
    // Convertir el resultado a un formato similar a pg
    return {
      rows: result.rows || [],
      rowCount: result.rowsAffected || (result.rows ? result.rows.length : 0),
      command: sql.trim().split(' ')[0].toUpperCase()
    };
  } catch (error) {
    console.error('❌ Error en consulta Oracle:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar conexión:', err);
      }
    }
  }
};

// Inicializar pool al cargar el módulo
let poolInitialized = false;
const getPool = async () => {
  if (!poolInitialized) {
    await initPool();
    poolInitialized = true;
  }
  return pool;
};

// Inicializar inmediatamente
getPool().catch(err => {
  console.error('❌ Error al inicializar pool:', err);
});

// Exportar funciones similares a pg
export default {
  query,
  getConnection: async () => {
    await getPool();
    if (!pool) {
      throw new Error('Pool no inicializado');
    }
    return await pool.getConnection();
  },
  end: async () => {
    if (pool) {
      await pool.close();
      console.log('✅ Pool de conexiones Oracle cerrado');
    }
  }
};
