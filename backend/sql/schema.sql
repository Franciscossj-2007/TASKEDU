-- ============================================================
-- Sistema de Gestion de Tareas Academicas
-- Esquema de base de datos PostgreSQL
-- Version: 1.0
-- ============================================================

-- Ejecutar conectado a la base de datos gestion_tareas_academicas.
-- Si se reconstruye desde cero, se pueden descomentar las siguientes
-- lineas para eliminar los objetos existentes (orden por dependencias).
-- DROP TABLE IF EXISTS tareas CASCADE;
-- DROP TABLE IF EXISTS cursos CASCADE;
-- DROP TABLE IF EXISTS usuarios CASCADE;

-- ============================================================
-- Tabla: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    correo         VARCHAR(150) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT usuarios_correo_unique UNIQUE (correo),
    CONSTRAINT usuarios_nombre_no_vacio CHECK (length(btrim(nombre)) > 0),
    CONSTRAINT usuarios_correo_formato CHECK (correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- ============================================================
-- Tabla: cursos
-- ============================================================
CREATE TABLE IF NOT EXISTS cursos (
    id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre       VARCHAR(100) NOT NULL,
    docente      VARCHAR(100),
    descripcion  TEXT,
    creado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cursos_nombre_no_vacio CHECK (length(btrim(nombre)) > 0)
);

-- ============================================================
-- Tabla: tareas
-- ============================================================
CREATE TABLE IF NOT EXISTS tareas (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    curso_id       INTEGER NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    titulo         VARCHAR(150) NOT NULL,
    descripcion    TEXT,
    fecha_entrega  TIMESTAMPTZ NOT NULL,
    prioridad      VARCHAR(10) NOT NULL,
    estado         VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tareas_titulo_no_vacio CHECK (length(btrim(titulo)) > 0),
    CONSTRAINT tareas_prioridad_valida CHECK (prioridad IN ('baja', 'media', 'alta')),
    CONSTRAINT tareas_estado_valido CHECK (estado IN ('pendiente', 'en_progreso', 'completada'))
);

-- ============================================================
-- Indices para consultas frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cursos_usuario_id      ON cursos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_tareas_curso_id        ON tareas (curso_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado          ON tareas (estado);
CREATE INDEX IF NOT EXISTS idx_tareas_prioridad       ON tareas (prioridad);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_entrega   ON tareas (fecha_entrega);
-- Indice compuesto util para listar tareas de un usuario por fecha.
CREATE INDEX IF NOT EXISTS idx_tareas_curso_estado    ON tareas (curso_id, estado);

-- ============================================================
-- Funcion y trigger: actualizar actualizado_en automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tareas_actualizado_en ON tareas;
CREATE TRIGGER trg_tareas_actualizado_en
    BEFORE UPDATE ON tareas
    FOR EACH ROW
    EXECUTE FUNCTION set_actualizado_en();
