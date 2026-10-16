import { query } from '../config/database.js';

const CAMPOS = `t.id, t.curso_id, c.nombre AS curso_nombre, t.titulo, t.descripcion,
                t.fecha_entrega, t.prioridad, t.estado, t.creado_en, t.actualizado_en,
                (t.fecha_entrega < NOW() AND t.estado <> 'completada') AS vencida`;

const ORDEN_VALIDO = {
  fecha_entrega: 't.fecha_entrega',
  creado_en: 't.creado_en',
  prioridad: `CASE t.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END`,
};

/**
 * Construye las condiciones WHERE y los parametros a partir de los filtros.
 */
function construirFiltros(usuarioId, filtros) {
  const condiciones = ['c.usuario_id = $1'];
  const params = [usuarioId];

  if (filtros.estado) {
    params.push(filtros.estado);
    condiciones.push(`t.estado = $${params.length}`);
  }

  if (filtros.prioridad) {
    params.push(filtros.prioridad);
    condiciones.push(`t.prioridad = $${params.length}`);
  }

  if (filtros.curso_id) {
    params.push(filtros.curso_id);
    condiciones.push(`t.curso_id = $${params.length}`);
  }

  if (filtros.busqueda) {
    params.push(`%${filtros.busqueda}%`);
    condiciones.push(`t.titulo ILIKE $${params.length}`);
  }

  if (filtros.vencimiento === 'proximas') {
    condiciones.push(`t.fecha_entrega BETWEEN NOW() AND NOW() + INTERVAL '7 days'`);
    condiciones.push(`t.estado <> 'completada'`);
  }

  if (filtros.vencimiento === 'vencidas') {
    condiciones.push(`t.fecha_entrega < NOW()`);
    condiciones.push(`t.estado <> 'completada'`);
  }

  return { where: condiciones.join(' AND '), params };
}

export async function listar(usuarioId, filtros) {
  const { where, params } = construirFiltros(usuarioId, filtros);

  const columnaOrden = ORDEN_VALIDO[filtros.orden] || 't.fecha_entrega';
  const direccion = filtros.dir === 'desc' ? 'DESC' : 'ASC';

  let paginacion = '';
  const paramsListar = [...params];
  if (filtros.limit) {
    paramsListar.push(filtros.limit);
    paginacion += ` LIMIT $${paramsListar.length}`;
    const page = filtros.page || 1;
    paramsListar.push((page - 1) * filtros.limit);
    paginacion += ` OFFSET $${paramsListar.length}`;
  }

  const { rows } = await query(
    `SELECT ${CAMPOS}
     FROM tareas t
     JOIN cursos c ON c.id = t.curso_id
     WHERE ${where}
     ORDER BY ${columnaOrden} ${direccion}
     ${paginacion}`,
    paramsListar,
  );

  const { rows: [conteo] } = await query(
    `SELECT COUNT(*)::int AS total
     FROM tareas t
     JOIN cursos c ON c.id = t.curso_id
     WHERE ${where}`,
    params,
  );

  return { datos: rows, total: conteo.total };
}

export async function buscarPorId(id) {
  const { rows } = await query(
    `SELECT ${CAMPOS}, c.usuario_id AS propietario_id
     FROM tareas t
     JOIN cursos c ON c.id = t.curso_id
     WHERE t.id = $1`,
    [id],
  );
  return rows[0] || null;
}

export async function crear({
  cursoId,
  titulo,
  descripcion,
  fechaEntrega,
  prioridad,
  estado,
}) {
  const { rows } = await query(
    `INSERT INTO tareas (curso_id, titulo, descripcion, fecha_entrega, prioridad, estado)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'pendiente'))
     RETURNING id, curso_id, titulo, descripcion, fecha_entrega, prioridad, estado,
               creado_en, actualizado_en`,
    [cursoId, titulo, descripcion ?? null, fechaEntrega, prioridad, estado ?? null],
  );
  return rows[0];
}

export async function actualizar(id, campos) {
  const columnas = {
    curso_id: 'curso_id',
    titulo: 'titulo',
    descripcion: 'descripcion',
    fecha_entrega: 'fecha_entrega',
    prioridad: 'prioridad',
    estado: 'estado',
  };

  const asignaciones = [];
  const valores = [];
  let i = 1;

  for (const [clave, valor] of Object.entries(campos)) {
    asignaciones.push(`${columnas[clave]} = $${i}`);
    valores.push(valor);
    i += 1;
  }

  valores.push(id);
  const { rows } = await query(
    `UPDATE tareas SET ${asignaciones.join(', ')}
     WHERE id = $${i}
     RETURNING id, curso_id, titulo, descripcion, fecha_entrega, prioridad, estado,
               creado_en, actualizado_en`,
    valores,
  );
  return rows[0] || null;
}

export async function actualizarEstado(id, estado) {
  const { rows } = await query(
    `UPDATE tareas SET estado = $1
     WHERE id = $2
     RETURNING id, curso_id, titulo, descripcion, fecha_entrega, prioridad, estado,
               creado_en, actualizado_en`,
    [estado, id],
  );
  return rows[0] || null;
}

export async function eliminar(id) {
  const { rowCount } = await query('DELETE FROM tareas WHERE id = $1', [id]);
  return rowCount > 0;
}

/**
 * Estadisticas del usuario autenticado para el panel de resumen.
 */
export async function estadisticas(usuarioId) {
  const { rows: [resumen] } = await query(
    `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.estado = 'pendiente')::int   AS pendientes,
        COUNT(*) FILTER (WHERE t.estado = 'en_progreso')::int AS en_progreso,
        COUNT(*) FILTER (WHERE t.estado = 'completada')::int  AS completadas,
        COUNT(*) FILTER (WHERE t.fecha_entrega < NOW()
                           AND t.estado <> 'completada')::int AS vencidas,
        COUNT(*) FILTER (WHERE t.fecha_entrega BETWEEN NOW() AND NOW() + INTERVAL '7 days'
                           AND t.estado <> 'completada')::int AS proximas
     FROM tareas t
     JOIN cursos c ON c.id = t.curso_id
     WHERE c.usuario_id = $1`,
    [usuarioId],
  );

  const { rows: porCurso } = await query(
    `SELECT c.id AS curso_id, c.nombre,
            COUNT(t.id)::int AS total,
            COUNT(t.id) FILTER (WHERE t.estado = 'completada')::int AS completadas
     FROM cursos c
     LEFT JOIN tareas t ON t.curso_id = c.id
     WHERE c.usuario_id = $1
     GROUP BY c.id
     ORDER BY c.nombre ASC`,
    [usuarioId],
  );

  const { rows: proximasEntregas } = await query(
    `SELECT ${CAMPOS}
     FROM tareas t
     JOIN cursos c ON c.id = t.curso_id
     WHERE c.usuario_id = $1
       AND t.estado <> 'completada'
       AND t.fecha_entrega >= NOW()
     ORDER BY t.fecha_entrega ASC
     LIMIT 5`,
    [usuarioId],
  );

  return { resumen, porCurso, proximasEntregas };
}
