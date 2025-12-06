-- Agregar columna offline_password a la tabla usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS offline_password VARCHAR(32);

-- Actualizar usuarios existentes con MD5 de la contraseña
-- NOTA: Esto requiere conocer las contraseñas originales, así que solo funciona para usuarios nuevos
-- Para usuarios existentes, necesitarás actualizarlos manualmente o recrearlos

-- Ejemplo para actualizar un usuario específico (reemplaza 'admin123' con la contraseña real):
-- UPDATE usuarios SET offline_password = MD5('admin123') WHERE username = 'admin';

