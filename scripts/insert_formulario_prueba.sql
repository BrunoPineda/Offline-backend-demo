-- Script para crear un formulario de prueba básico
-- Formulario: "Formulario de Prueba Básico"
-- 2 secciones con 5 preguntas cada una

SET SERVEROUTPUT ON;

DECLARE
    v_form_id NUMBER;
    v_seccion_id_1 NUMBER;
    v_seccion_id_2 NUMBER;
    v_campo_id NUMBER;
BEGIN
    -- Insertar Formulario
    INSERT INTO IDO_FORMULARIO.CBTC_FORMULARIOS (
        ID_FORMULARIO, NO_TITULO, DE_DESCRIPCION, CO_ESTADO, CO_CATEGORIA, 
        ID_USUARIO_CREADOR, FE_INICIO, FE_FIN, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_FORMULARIOS.NEXTVAL, 
        'Formulario de Prueba Básico', 
        'Formulario de prueba con 2 secciones y 5 preguntas en cada una para validar el sistema.',
        'PUBLICADO', 
        'PRUEBA',
        1, -- Asumiendo que el usuario ID 1 existe
        SYSDATE, 
        SYSDATE + 365, 
        SYSDATE, 
        SYSDATE
    )
    RETURNING ID_FORMULARIO INTO v_form_id;

    DBMS_OUTPUT.PUT_LINE('✅ Formulario creado con ID: ' || v_form_id);

    -- ========== SECCIÓN 1: Información Personal ==========
    INSERT INTO IDO_FORMULARIO.CBTC_SECCIONES (
        ID_SECCION, ID_FORMULARIO, NO_TITULO, DE_DESCRIPCION, NU_ORDEN, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_SECCIONES.NEXTVAL,
        v_form_id,
        'Información Personal',
        'Datos básicos de la persona',
        1,
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_SECCION INTO v_seccion_id_1;

    DBMS_OUTPUT.PUT_LINE('✅ Sección 1 creada con ID: ' || v_seccion_id_1);

    -- Campo 1: Nombre Completo (TEXTO_CORTO)
    INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS (
        ID_CAMPO, ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, NU_ORDEN, 
        FL_OBLIGATORIO, FL_ACTIVO, NU_MIN_CARACTERES, NU_MAX_CARACTERES, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_CAMPOS.NEXTVAL,
        v_seccion_id_1,
        'TEXTO_CORTO',
        'Nombre Completo',
        'Ingrese su nombre completo',
        1,
        'S',
        'S',
        3,
        100,
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_CAMPO INTO v_campo_id;

    DBMS_OUTPUT.PUT_LINE('  ✅ Campo 1 (Nombre) creado con ID: ' || v_campo_id);

    -- Campo 2: Correo Electrónico (EMAIL)
    INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS (
        ID_CAMPO, ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, NU_ORDEN, 
        FL_OBLIGATORIO, FL_ACTIVO, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_CAMPOS.NEXTVAL,
        v_seccion_id_1,
        'EMAIL',
        'Correo Electrónico',
        'ejemplo@correo.com',
        2,
        'S',
        'S',
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_CAMPO INTO v_campo_id;

    DBMS_OUTPUT.PUT_LINE('  ✅ Campo 2 (Email) creado con ID: ' || v_campo_id);

    -- Campo 3: Edad (NUMERO)
    INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS (
        ID_CAMPO, ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, NU_ORDEN, 
        FL_OBLIGATORIO, FL_ACTIVO, NU_MIN_VALOR, NU_MAX_VALOR, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_CAMPOS.NEXTVAL,
        v_seccion_id_1,
        'NUMERO',
        'Edad',
        'Ingrese su edad',
        3,
        'S',
        'S',
        1,
        120,
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_CAMPO INTO v_campo_id;

    DBMS_OUTPUT.PUT_LINE('  ✅ Campo 3 (Edad) creado con ID: ' || v_campo_id);

    -- Campo 4: Fecha de Nacimiento (FECHA)
    INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS (
        ID_CAMPO, ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, NU_ORDEN, 
        FL_OBLIGATORIO, FL_ACTIVO, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_CAMPOS.NEXTVAL,
        v_seccion_id_1,
        'FECHA',
        'Fecha de Nacimiento',
        'Seleccione su fecha de nacimiento',
        4,
        'S',
        'S',
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_CAMPO INTO v_campo_id;

    DBMS_OUTPUT.PUT_LINE('  ✅ Campo 4 (Fecha Nacimiento) creado con ID: ' || v_campo_id);

    -- Campo 5: Descripción (TEXTO_LARGO)
    INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS (
        ID_CAMPO, ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, NU_ORDEN, 
        FL_OBLIGATORIO, FL_ACTIVO, NU_MIN_CARACTERES, NU_MAX_CARACTERES, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_CAMPOS.NEXTVAL,
        v_seccion_id_1,
        'TEXTO_LARGO',
        'Descripción Personal',
        'Escriba una breve descripción sobre usted',
        5,
        'N',
        'S',
        10,
        500,
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_CAMPO INTO v_campo_id;

    DBMS_OUTPUT.PUT_LINE('  ✅ Campo 5 (Descripción) creado con ID: ' || v_campo_id);

    -- ========== SECCIÓN 2: Preferencias ==========
    INSERT INTO IDO_FORMULARIO.CBTC_SECCIONES (
        ID_SECCION, ID_FORMULARIO, NO_TITULO, DE_DESCRIPCION, NU_ORDEN, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_SECCIONES.NEXTVAL,
        v_form_id,
        'Preferencias',
        'Sus preferencias y opiniones',
        2,
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_SECCION INTO v_seccion_id_2;

    DBMS_OUTPUT.PUT_LINE('✅ Sección 2 creada con ID: ' || v_seccion_id_2);

    -- Campo 6: Lenguaje Favorito (SELECCION)
    INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS (
        ID_CAMPO, ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, NU_ORDEN, 
        FL_OBLIGATORIO, FL_ACTIVO, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_CAMPOS.NEXTVAL,
        v_seccion_id_2,
        'SELECCION',
        'Lenguaje de Programación Favorito',
        'Seleccione su lenguaje favorito',
        1,
        'S',
        'S',
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_CAMPO INTO v_campo_id;

    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'JavaScript', 'javascript', 1, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Python', 'python', 2, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Java', 'java', 3, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'C++', 'cpp', 4, SYSDATE);

    DBMS_OUTPUT.PUT_LINE('  ✅ Campo 6 (SELECCION) creado con ID: ' || v_campo_id);

    -- Campo 7: Sistema Operativo (OPCION_UNICA con "Otro")
    INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS (
        ID_CAMPO, ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, NU_ORDEN, 
        FL_OBLIGATORIO, FL_ACTIVO, FL_TIENE_OTRO, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_CAMPOS.NEXTVAL,
        v_seccion_id_2,
        'OPCION_UNICA',
        'Sistema Operativo',
        'Seleccione el sistema operativo que utiliza',
        2,
        'S',
        'S',
        'S',
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_CAMPO INTO v_campo_id;

    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Windows', 'windows', 1, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Linux', 'linux', 2, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'macOS', 'macos', 3, SYSDATE);

    DBMS_OUTPUT.PUT_LINE('  ✅ Campo 7 (OPCION_UNICA) creado con ID: ' || v_campo_id);

    -- Campo 8: Herramientas de Desarrollo (OPCION_MULTIPLE)
    INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS (
        ID_CAMPO, ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, NU_ORDEN, 
        FL_OBLIGATORIO, FL_ACTIVO, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_CAMPOS.NEXTVAL,
        v_seccion_id_2,
        'OPCION_MULTIPLE',
        'Herramientas de Desarrollo que Utiliza',
        'Seleccione todas las que apliquen',
        3,
        'S',
        'S',
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_CAMPO INTO v_campo_id;

    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Visual Studio Code', 'vscode', 1, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'IntelliJ IDEA', 'intellij', 2, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Eclipse', 'eclipse', 3, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Git', 'git', 4, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Docker', 'docker', 5, SYSDATE);

    DBMS_OUTPUT.PUT_LINE('  ✅ Campo 8 (OPCION_MULTIPLE) creado con ID: ' || v_campo_id);

    -- Campo 9: Nivel de Experiencia (OPCION_UNICA sin "Otro")
    INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS (
        ID_CAMPO, ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, NU_ORDEN, 
        FL_OBLIGATORIO, FL_ACTIVO, FL_TIENE_OTRO, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_CAMPOS.NEXTVAL,
        v_seccion_id_2,
        'OPCION_UNICA',
        'Nivel de Experiencia',
        'Seleccione su nivel',
        4,
        'S',
        'S',
        'N',
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_CAMPO INTO v_campo_id;

    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Principiante', 'principiante', 1, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Intermedio', 'intermedio', 2, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Avanzado', 'avanzado', 3, SYSDATE);
    INSERT INTO IDO_FORMULARIO.CBTC_OPCIONES_CAMPOS (ID_CAMPO, NO_TEXTO, DE_VALOR, NU_ORDEN, FE_CREACION) VALUES (v_campo_id, 'Experto', 'experto', 4, SYSDATE);

    DBMS_OUTPUT.PUT_LINE('  ✅ Campo 9 (OPCION_UNICA sin Otro) creado con ID: ' || v_campo_id);

    -- Campo 10: Comentarios Adicionales (TEXTO_LARGO)
    INSERT INTO IDO_FORMULARIO.CBTC_CAMPOS (
        ID_CAMPO, ID_SECCION, CO_TIPO, NO_LABEL, DE_PLACEHOLDER, NU_ORDEN, 
        FL_OBLIGATORIO, FL_ACTIVO, NU_MIN_CARACTERES, NU_MAX_CARACTERES, FE_CREACION, FE_ACTUALIZACION
    )
    VALUES (
        IDO_FORMULARIO.CBSE_CAMPOS.NEXTVAL,
        v_seccion_id_2,
        'TEXTO_LARGO',
        'Comentarios Adicionales',
        'Escriba cualquier comentario adicional',
        5,
        'N',
        'S',
        0,
        1000,
        SYSDATE,
        SYSDATE
    )
    RETURNING ID_CAMPO INTO v_campo_id;

    DBMS_OUTPUT.PUT_LINE('  ✅ Campo 10 (Comentarios) creado con ID: ' || v_campo_id);

    COMMIT;

    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('========================================');
    DBMS_OUTPUT.PUT_LINE('✅ FORMULARIO DE PRUEBA CREADO EXITOSAMENTE');
    DBMS_OUTPUT.PUT_LINE('========================================');
    DBMS_OUTPUT.PUT_LINE('ID del Formulario: ' || v_form_id);
    DBMS_OUTPUT.PUT_LINE('Total de Secciones: 2');
    DBMS_OUTPUT.PUT_LINE('Total de Campos: 10');
    DBMS_OUTPUT.PUT_LINE('========================================');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('❌ Error al crear formulario: ' || SQLERRM);
        RAISE;
END;
/

