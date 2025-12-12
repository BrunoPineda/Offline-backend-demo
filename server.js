import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// database.js ya carga dotenv internamente
import pool from './config/database.js';

// Importar APIs
import authRoutes from './api/auth.js';
import usuariosRoutes from './api/usuarios.js';
import productosRoutes from './api/productos.js';
import syncRoutes from './api/sync.js';
import formulariosRoutes from './api/formularios.js';
import seccionesRoutes from './api/secciones.js';
import seccionesStandaloneRoutes from './api/secciones-standalone.js';
import camposRoutes from './api/campos.js';
import camposStandaloneRoutes from './api/campos-standalone.js';
import rolesRoutes from './api/roles.js';
import respuestasRoutes from './api/respuestas.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para pasar io a las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Verificar que las tablas existan (no las crea, solo verifica)
// Las tablas deben ser creadas ejecutando el script create_oracle_schema.sql
const verifyTables = async () => {
  try {
    // Verificar tabla de usuarios
    await pool.query('SELECT COUNT(*) FROM IDO_FORMULARIO.CBTC_USUARIOS');
    console.log('✅ Tabla IDO_FORMULARIO.CBTC_USUARIOS existe');

    // Verificar tabla de productos
    await pool.query('SELECT COUNT(*) FROM IDO_FORMULARIO.CBTC_PRODUCTOS');
    console.log('✅ Tabla IDO_FORMULARIO.CBTC_PRODUCTOS existe');

    console.log('✅ Todas las tablas verificadas correctamente');
  } catch (error) {
    console.error('❌ Error al verificar tablas:', error);
    console.error('   Asegúrate de ejecutar el script create_oracle_schema.sql primero');
    throw error;
  }
};

// Rutas
app.use('/login', authRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/productos', productosRoutes);
app.use('/sync', syncRoutes);
app.use('/formularios', formulariosRoutes);
app.use('/formularios', seccionesRoutes); // /formularios/:id_formulario/secciones
app.use('/secciones', seccionesStandaloneRoutes); // /secciones/:id (PUT, DELETE)
app.use('/secciones', camposRoutes); // /secciones/:id_seccion/campos
app.use('/campos', camposStandaloneRoutes); // /campos/:id (PUT, DELETE)
app.use('/roles', rolesRoutes); // /roles
app.use('/respuestas', respuestasRoutes); // /respuestas

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API del Sistema Offline funcionando con Oracle' });
});

// Socket.io - Sincronización en tiempo real
io.on('connection', (socket) => {
  console.log('✅ Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// Sincronización programada (cada hora)
setInterval(async () => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as total FROM IDO_FORMULARIO.CBTC_PRODUCTOS'
    );
    console.log(`📊 Sincronización programada - Total productos: ${result.rows[0].TOTAL}`);
    io.emit('sync_programada', { timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error en sincronización programada:', error);
  }
}, 3600000); // Cada hora

// Inicializar servidor
const startServer = async () => {
  try {
    // Esperar a que el pool esté inicializado
    await new Promise(resolve => setTimeout(resolve, 1000));
    await verifyTables();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📡 Socket.io disponible en ws://localhost:${PORT}`);
      console.log(`🗄️  Base de datos: Oracle (IDO_FORMULARIO)`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

// Manejar cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  try {
    await pool.end();
    httpServer.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error al cerrar:', error);
    process.exit(1);
  }
});

startServer();
