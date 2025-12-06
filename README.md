# Backend - Sistema Offline

Backend Node.js con Express, PostgreSQL, JWT y Socket.io

## Instalación

```bash
npm install
```

## Configuración

1. Copiar `.env` y configurar las variables de entorno
2. La conexión a la base de datos ya está configurada en `.env`

## Ejecutar

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Endpoints

- `POST /login` - Autenticación
- `POST /usuarios` - Crear usuario
- `GET /usuarios` - Listar usuarios (requiere autenticación)
- `POST /productos` - Crear producto (requiere autenticación)
- `GET /productos` - Listar productos (requiere autenticación)
- `PUT /productos/:id` - Actualizar producto (requiere autenticación)
- `DELETE /productos/:id` - Eliminar producto (requiere autenticación)
- `POST /sync` - Sincronizar cambios (requiere autenticación)
- `POST /sync/push` - Enviar cambios al servidor (requiere autenticación)

## Socket.io

Eventos emitidos:
- `producto_creado` - Cuando se crea un producto
- `producto_actualizado` - Cuando se actualiza un producto
- `producto_eliminado` - Cuando se elimina un producto
- `sync_programada` - Sincronización programada (cada hora)

