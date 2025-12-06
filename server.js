import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// database.js ya carga dotenv internamente
import pool from './config/database.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import productosRoutes from './routes/productos.js';
import syncRoutes from './routes/sync.js';

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

// Crear tablas si no existen
const createTables = async () => {
  try {
    // Tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tabla de productos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(30) NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        cantidad INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Tablas creadas o ya existen');
  } catch (error) {
    console.error('❌ Error al crear tablas:', error);
  }
};

// Rutas
app.use('/login', authRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/productos', productosRoutes);
app.use('/sync', syncRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API del Sistema Offline funcionando' });
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
      'SELECT COUNT(*) as total FROM productos'
    );
    console.log(`📊 Sincronización programada - Total productos: ${result.rows[0].total}`);
    io.emit('sync_programada', { timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error en sincronización programada:', error);
  }
}, 3600000); // Cada hora

// Inicializar servidor
const startServer = async () => {
  try {
    await createTables();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📡 Socket.io disponible en ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

