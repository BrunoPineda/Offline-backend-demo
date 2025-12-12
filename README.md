# Backend - Sistema Offline

Backend Node.js con Express, Oracle Database, JWT y Socket.io

## Requisitos Previos

1. **Oracle Database** - Se requiere una instancia de Oracle Database
2. **Oracle Instant Client** - Necesario para la conexión desde Node.js
   - Descargar desde: https://www.oracle.com/database/technologies/instant-client/downloads.html
   - Instalar según tu sistema operativo

## Instalación

```bash
npm install
```

## Configuración de la Base de Datos

1. **Crear el esquema en Oracle:**
   - Ejecutar el script `scripts/create_oracle_schema.sql` en tu base de datos Oracle
   - Este script crea las tablas, secuencias, índices y triggers necesarios

2. **Configurar variables de entorno:**
   - Copiar `.env.example` a `.env`
   - Configurar las siguientes variables:
     ```
     DB_USER=IDO_FORMULARIO
     DB_PASSWORD=MFLstcIII4#
     DB_CONNECTION_STRING=192.168.125.181:1521/juntosdv
     JWT_SECRET=tu_secret_jwt_aqui
     PORT=3000
     ```

## Estructura de la Base de Datos

El sistema utiliza las siguientes tablas siguiendo las convenciones de nomenclatura:

- **CBTC_USUARIOS** - Tabla de usuarios
  - ID_USUARIO (PK)
  - NO_USERNAME
  - CO_PASSWORD_HASH
  - DI_CORREO
  - CO_OFFLINE_PASSWORD
  - FE_CREACION

- **CBTC_PRODUCTOS** - Tabla de productos
  - ID_PRODUCTO (PK)
  - NO_PRODUCTO
  - ME_PRECIO
  - CA_CANTIDAD
  - FE_CREACION
  - FE_ACTUALIZACION

- **Secuencias:**
  - CBSE_USUARIOS - Para IDs de usuarios
  - CBSE_PRODUCTOS - Para IDs de productos

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

## Notas de Migración desde PostgreSQL

- Todas las consultas SQL han sido adaptadas a la sintaxis de Oracle
- Los parámetros ahora usan `:1, :2, ...` en lugar de `$1, $2, ...`
- Las funciones `NOW()` fueron reemplazadas por `SYSDATE`
- Los tipos `SERIAL` fueron reemplazados por secuencias de Oracle
- La paginación usa `OFFSET ... ROWS FETCH NEXT ... ROWS ONLY`
