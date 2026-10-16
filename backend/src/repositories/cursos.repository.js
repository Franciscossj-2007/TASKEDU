import { query } from '../config/database.js';

const CAMPOS = 'id, usuario_id, nombre, docente, descripcion, creado_en';

export async function listarPorUsuario(usuarioId) {
  const { rows } = await query(
    `SELECT c.id, c.usuario_id, c.nombre, c.docente, c.descripcion, c.creado_en,
            COUNT(t.id)::int AS total_tareas
     FROM cursos c
     LEFT JOIN tareas t ON t.curso_id = c.id
     WHERE c.usuario_id = $1
     GROUP BY c.id
     ORDER BY c.creado_en DESC`,
    [usuarioId],
  );
  return rows;
}

export async function buscarPorId(id) {
  const { rows } = await query(
    `SELECT ${CAMPOS} FROM cursos WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}

export async function crear({ usuarioId, nombre, docente, descripcion }) {
  const { rows } = await query(
    `INSERT INTO cursos (usuario_id, nombre, docente, descripcion)
     VALUES ($1, $2, $3, $4)
     RETURNING ${CAMPOS}`,
    [usuarioId, nombre, docente ?? null, descripcion ?? null],
  );
  return rows[0];
}

export async function actualizar(id, campos) {
  const asignaciones = [];
  const valores = [];
  let i = 1;

  for (const [columna, valor] of Object.entries(campos)) {
    asignaciones.push(`${columna} = $${i}`);
    valores.push(valor);
    i += 1;
  }

  valores.push(id);
  const { rows } = await query(
    `UPDATE cursos SET ${asignaciones.join(', ')}
     WHERE id = $${i}
     RETURNING ${CAMPOS}`,
    valores,
  );
  return rows[0] || null;
}

export async function eliminar(id) {
  const { rowCount } = await query('DELETE FROM cursos WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function listarTareas(cursoId) {
  const { rows } = await query(
    `SELECT id, curso_id, titulo, descripcion, fecha_entrega, prioridad,
            estado, creado_en, actualizado_en,
            (fecha_entrega < NOW() AND estado <> 'completada') AS vencida
     FROM tareas
     WHERE curso_id = $1
     ORDER BY fecha_entrega ASC`,
    [cursoId],
  );
  return rows;
}
