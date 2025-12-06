import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el directorio del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde el archivo .env en el directorio raíz del backend
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

// Verificar que la variable de entorno esté disponible
if (!process.env.DB_CONNECTION_STRING) {
  console.error('❌ Error: DB_CONNECTION_STRING no está definida en las variables de entorno');
  console.error('   Asegúrate de tener un archivo .env en el directorio backend/ con la configuración de la base de datos');
  console.error('   Ruta esperada:', join(__dirname, '..', '.env'));
  process.exit(1);
}

console.log('📝 DB_CONNECTION_STRING cargada:', process.env.DB_CONNECTION_STRING.substring(0, 50) + '...');

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: process.env.DB_CONNECTION_STRING?.includes('neon.tech') ? {
    rejectUnauthorized: false
  } : undefined
});

// Probar la conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
});

export default pool;

