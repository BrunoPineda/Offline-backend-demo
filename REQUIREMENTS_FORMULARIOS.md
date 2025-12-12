# Requerimientos del Sistema de Formularios Dinámicos

## 0. Sistema de Roles y Permisos

### 0.1 Roles del Sistema
- **ADMINISTRADOR**:
  - Puede crear formularios
  - Puede editar formularios
  - Puede eliminar formularios
  - Puede ver todas las respuestas
  - Puede exportar respuestas
  - Acceso completo al sistema
  
- **GESTOR_LOCAL**:
  - Puede ver formularios disponibles
  - Puede llenar formularios
  - Puede responder múltiples veces el mismo formulario
  - Puede guardar borradores
  - Puede ver sus propias respuestas
  - **NO puede crear formularios**

### 0.2 Estructura de Roles
- Tabla maestra: **CBTC_ROLES** (tabla de roles)
- Relación: **CBTC_USUARIOS.ID_ROL** → **CBTC_ROLES.ID_ROL**
- Un usuario tiene un solo rol asignado
- Los roles son predefinidos pero pueden activarse/desactivarse
- Scripts:
  - `create_roles_schema.sql` - Crear tabla de roles y agregar columna a usuarios
  - `update_users_with_roles.sql` - Asignar roles a usuarios existentes
  - `drop_roles_schema.sql` - Eliminar sistema de roles

## 1. Gestión de Formularios

### 1.1 Características Básicas
- ✅ Los formularios pueden duplicarse/clonarse
- ✅ Los formularios pueden estar activos/inactivos
- ✅ Se pueden programar fechas de inicio/fin de disponibilidad
- ✅ Metadata requerida:
  - Creador (usuario que crea el formulario)
  - Fecha de creación
  - Fecha de actualización (para sincronización)
  - Estado: borrador/publicado/cerrado
  - Categoría/tipo
  - Título del formulario
  - Descripción (opcional)

### 1.2 Estados del Formulario
- **Borrador**: Formulario en edición, no visible para responder
- **Publicado**: Formulario activo y disponible para responder
- **Cerrado**: Formulario no disponible para nuevas respuestas

### 1.3 Disponibilidad
- Fecha de inicio: Fecha desde la cual el formulario está disponible
- Fecha de fin: Fecha hasta la cual el formulario está disponible
- Si no hay fechas, el formulario está siempre disponible (si está publicado)

### 1.4 Respuestas Múltiples
- ✅ Un usuario puede responder el mismo formulario **múltiples veces**
- Cada respuesta es independiente y se guarda con su propio ID

## 2. Estructura de Formularios

### 2.1 Secciones (Sesiones)
- Los formularios están organizados en **secciones** (también llamadas "sesiones")
- Cada sección tiene:
  - Título (obligatorio)
  - Descripción (opcional)
  - Orden (para ordenar las secciones)
  - Estado de completitud (completada/pendiente) - para mostrar en Flutter
  - Pueden contraerse/expandirse
  - Muestra qué secciones ya están completadas

### 2.2 Campos del Formulario
Cada campo pertenece a una sección y tiene:
- **Tipo de campo** (ver sección 2.3)
- **Etiqueta/Label** (obligatorio)
- **Placeholder** (opcional)
- **Valor por defecto** (opcional)
- **Ayuda/Descripción** (opcional)
- **Orden** dentro de la sección
- **Campo obligatorio** (sí/no)
- **Validaciones** (ver sección 2.4)
- **Estado**: activo/inactivo

### 2.3 Tipos de Campos Soportados
1. **Texto corto** - Campo de texto de una línea
2. **Texto largo** - Campo de texto multilínea
3. **Selección** - Dropdown/Select con opciones
4. **Opción única** - Radio buttons (solo una opción)
5. **Opción múltiple** - Checkboxes (múltiples opciones)
6. **Fecha** - Selector de fecha
7. **Número** - Campo numérico
8. **Email** - Campo de email con validación

### 2.4 Opciones de Campos
Para campos de tipo Selección, Opción única y Opción múltiple:
- Cada opción tiene:
  - Texto de la opción
  - Valor de la opción
  - Orden
  - Opción "Otro" con campo de texto libre (opcional)
- Las opciones se pueden agregar/eliminar dinámicamente
- Si tiene "Otro", permite escribir texto libre

### 2.5 Validaciones de Campos
- **Mínimo de caracteres** (para texto)
- **Máximo de caracteres** (para texto)
- **Patrón Regex** (opcional, para validación personalizada)
- **Rango numérico** (mínimo/máximo para números)
- **Formato de fecha** (para campos de fecha)
- **Email válido** (validación automática para email)
- **Campo obligatorio** (sí/no)

## 3. Respuestas de Formularios

### 3.1 Características
- ✅ Un usuario puede responder el mismo formulario **múltiples veces**
- ✅ Las respuestas se pueden editar después de enviar (hasta cierto tiempo)
- ✅ Fecha límite para responder (opcional, basada en fecha de fin del formulario)

### 3.2 Guardado Temporal (Borrador)
- **Guardado temporal** antes de enviar definitivamente
- Permite guardar el progreso sin completar todos los campos
- El usuario puede continuar más tarde desde donde lo dejó
- Se guarda por usuario autenticado
- **Un borrador por usuario por formulario** (constraint único)
- Se mantiene hasta que el usuario:
  - Complete y envíe el formulario
  - Elimine el borrador manualmente
  - O expire después de un tiempo (configurable)

### 3.3 Datos de Respuesta
Cada respuesta contiene:
- ID de formulario
- ID de usuario que responde
- Fecha de inicio de respuesta
- Fecha de última actualización (para sincronización)
- Fecha de envío (cuando se completa)
- Estado: borrador/completado
- Datos de cada campo respondido

## 4. Sincronización con Flutter

### 4.1 Flutter (App Móvil)
- ✅ **Puede OBTENER** formularios del servidor
- ✅ **Puede OBTENER** respuestas guardadas
- ✅ **Puede ENVIAR** respuestas al servidor
- ✅ **Puede GUARDAR** borradores temporalmente (localmente en SQLite)
- ❌ **NO puede CREAR** formularios (solo desde el frontend web)
- ❌ **NO puede EDITAR** formularios (solo desde el frontend web)
- ✅ Sincronización bidireccional de respuestas (Flutter ↔ Backend)

### 4.2 Campos de Sincronización
Todos los registros deben tener:
- `FE_CREACION` - Fecha de creación (para sincronización)
- `FE_ACTUALIZACION` - Fecha de última actualización (para sincronización)
- Estos campos permiten identificar qué registros han cambiado

## 5. Permisos y Acceso

### 5.1 Creación de Formularios
- Solo usuarios con rol **ADMINISTRADOR** pueden crear formularios
- El creador del formulario es el usuario autenticado actual

### 5.2 Acceso a Formularios
- Los formularios requieren autenticación para responder
- No hay formularios públicos (todos requieren login)
- Usuarios con rol **GESTOR_LOCAL** pueden ver y responder formularios

## 6. Reportes y Exportación

### 6.1 Reportes
- Estadísticas de respuestas por formulario
- Resumen de respuestas completadas vs borradores
- Gráficos y visualizaciones (futuro)

### 6.2 Exportación
- ✅ **Exportación a Excel**: Formato entendible por el usuario final
- ✅ **Exportación a PDF**: Formato entendible por el usuario final
- Las exportaciones incluyen:
  - Datos del formulario
  - Todas las respuestas
  - Fechas de respuesta
  - Usuarios que respondieron
- El formato debe ser claro y fácil de entender para usuarios no técnicos

## 7. Integración con Sistema Actual

### 7.1 Relaciones
- Los formularios se relacionan con usuarios (creador y quien responde)
- Los usuarios se relacionan con roles (ADMINISTRADOR, GESTOR_LOCAL)
- **NO se relacionan** con productos (por ahora)
- **NO se relacionan** con otros módulos (por ahora)

### 7.2 Autenticación y Roles
- Usa el mismo sistema de autenticación JWT existente
- **Sistema de Roles**:
  - **ADMINISTRADOR**: Puede crear, editar y eliminar formularios. Acceso completo al sistema.
  - **GESTOR_LOCAL**: Puede ver y llenar formularios. Puede responder múltiples veces el mismo formulario.
- Los roles se almacenan en la tabla **CBTC_ROLES** (tabla maestra)
- Los usuarios tienen un campo **ID_ROL** que referencia a **CBTC_ROLES**
- Un usuario tiene un solo rol asignado

## 8. Especificaciones Técnicas

### 8.1 Base de Datos
- **Esquema**: Usar el mismo esquema **IDO_FORMULARIO** (no crear nuevo esquema)
- **Convenciones de nombres**: Seguir el patrón existente (CBTC_, CBSE_, etc.)
- **Tablas principales**:
  - **CBTC_ROLES** - Tabla maestra de roles
  - **CBTC_USUARIOS** - Usuarios (con columna ID_ROL agregada)
  - **CBTC_FORMULARIOS** - Formularios principales
  - **CBTC_SECCIONES** - Secciones (sesiones) de los formularios
  - **CBTC_CAMPOS** - Campos de cada sección
  - **CBTC_OPCIONES_CAMPOS** - Opciones para campos de selección/radio/checkbox
  - **CBTC_RESPUESTAS** - Respuestas completas de usuarios
  - **CBTC_RESPUESTA_VALORES** - Valores individuales de cada campo respondido
  - **CBTC_BORRADORES** - Borradores temporales (un borrador por usuario por formulario)
  - **CBTC_BORRADOR_VALORES** - Valores de borradores temporales
- **Secuencias**: 
  - CBSE_ROLES
  - CBSE_FORMULARIOS, CBSE_SECCIONES, CBSE_CAMPOS, CBSE_OPCIONES_CAMPOS
  - CBSE_RESPUESTAS, CBSE_RESPUESTA_VALORES
  - CBSE_BORRADORES, CBSE_BORRADOR_VALORES
- **Índices**: Para optimizar búsquedas por estado, usuario, fechas, actualización
- **Triggers**: Para actualizar automáticamente FE_ACTUALIZACION en todas las tablas
- **Scripts**: 
  - `create_roles_schema.sql` - Crear sistema de roles
  - `update_users_with_roles.sql` - Asignar roles a usuarios existentes
  - `create_formularios_schema.sql` - Crear todas las tablas de formularios
  - `drop_roles_schema.sql` - Eliminar sistema de roles
  - `drop_formularios_schema.sql` - Eliminar todas las tablas de formularios

### 8.2 Backend
- Endpoints REST para CRUD de formularios (solo ADMINISTRADOR)
- Endpoints para obtener formularios (con secciones y campos) - GESTOR_LOCAL y ADMINISTRADOR
- Endpoints para guardar/obtener respuestas - GESTOR_LOCAL y ADMINISTRADOR
- Endpoints para guardar/obtener borradores - GESTOR_LOCAL y ADMINISTRADOR
- Endpoints para exportar respuestas (Excel, PDF) - Solo ADMINISTRADOR
- Middleware de verificación de roles
- Sincronización basada en fechas de actualización

### 8.3 Frontend (Angular)
- Módulo completo de gestión de formularios (solo ADMINISTRADOR)
- Constructor visual de formularios (drag & drop)
- Vista previa de formularios
- Gestión de respuestas
- Exportación de respuestas (solo ADMINISTRADOR)
- Verificación de roles en el frontend

### 8.4 Flutter (App Móvil)
- Visualización de formularios (GESTOR_LOCAL)
- Responder formularios (GESTOR_LOCAL)
- Guardado temporal (borradores) (GESTOR_LOCAL)
- Sincronización de respuestas (GESTOR_LOCAL)
- Indicador de secciones completadas
- **NO puede crear formularios** (solo ADMINISTRADOR desde web)

## 9. Casos de Uso Principales

### 9.1 Crear Formulario (Web - ADMINISTRADOR)
1. Usuario ADMINISTRADOR crea nuevo formulario
2. Agrega título y descripción
3. Agrega secciones
4. Agrega campos a cada sección
5. Configura validaciones
6. Guarda como borrador o publica

### 9.2 Responder Formulario (Flutter - GESTOR_LOCAL)
1. Usuario GESTOR_LOCAL ve lista de formularios disponibles
2. Selecciona un formulario
3. Ve secciones (puede contraer/expandir)
4. Ve qué secciones están completadas
5. Llena campos
6. Guarda temporalmente (borrador)
7. Completa todas las secciones
8. Envía formulario

### 9.3 Ver Respuestas (Web - ADMINISTRADOR)
1. Usuario ADMINISTRADOR ve lista de formularios creados
2. Selecciona un formulario
3. Ve todas las respuestas
4. Exporta a Excel o PDF

## 10. Consideraciones de Diseño

### 10.1 Performance
- Paginación en listados de formularios y respuestas
- Carga lazy de secciones y campos
- Índices en campos de búsqueda frecuente

### 10.2 Escalabilidad
- Estructura normalizada para evitar redundancia
- Posibilidad de agregar nuevos tipos de campos en el futuro
- Sistema de plugins para validaciones personalizadas (futuro)

### 10.3 Usabilidad
- Interfaz intuitiva para crear formularios
- Validaciones en tiempo real
- Feedback visual de progreso
- Guardado automático de borradores (opcional)

## 11. Próximas Funcionalidades (Futuro)

- [ ] Condicionales: Mostrar campos basados en respuestas de otros campos
- [ ] Lógica de salto: Saltar secciones basado en respuestas
- [ ] Plantillas predefinidas de formularios
- [ ] Compartir formularios por enlace
- [ ] Notificaciones de nuevas respuestas
- [ ] Dashboard de estadísticas
- [ ] Gráficos de respuestas
- [ ] Exportación avanzada con filtros
- [ ] Múltiples roles por usuario (si se requiere)

---

**Nota**: Este documento define los requerimientos completos del sistema de formularios dinámicos. La implementación seguirá estos requerimientos.
