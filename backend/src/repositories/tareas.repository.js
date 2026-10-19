import { query } from '../config/database.js';

// Columnas que se devuelven de una tarea. Incluye el nombre del curso (JOIN)
// y "vencida": true si la fecha ya pasó y la tarea no está completada.
const CAMPOS = `t.id, t.curso_id, c.nombre AS curso_nombre, t.titulo, t.descripcion,
                t.fecha_entrega, t.prioridad, t.estado, t.creado_en, t.actualizado_en,
                (t.fecha_entrega < NOW() AND t.estado <> 'completada') AS vencida`;

// Lista blanca de criterios de orden. Evita inyección SQL porque ORDER BY no admite parámetros.
const ORDEN_VALIDO = {
  fecha_entrega: 't.fecha_entrega',
  creado_en: 't.creado_en',
  // Orden por importancia: alta (1), media (2), baja (3).
  prioridad: `CASE t.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END`,
};

/**
 * Construye las condiciones WHERE y los parametros a partir de los filtros.
 */
function construirFiltros(usuarioId, filtros) {
  // La primera condición siempre limita a las tareas del usuario ($1).
  const condiciones = ['c.usuario_id = $1'];
  const params = [usuarioId];

  // Por cada filtro presente se añade el valor a params y su condición con el $n correspondiente.
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
    // ILIKE = búsqueda sin distinguir mayúsculas; % = cualquier texto alrededor.
    params.push(`%${filtros.busqueda}%`);
    condiciones.push(`t.titulo ILIKE $${params.length}`);
  }

  // "Próximas": vencen dentro de los siguientes 7 días y no están completadas.
  if (filtros.vencimiento === 'proximas') {
    condiciones.push(`t.fecha_entrega BETWEEN NOW() AND NOW() + INTERVAL '7 days'`);
    condiciones.push(`t.estado <> 'completada'`);
  }

  // "Vencidas": fecha pasada y no completadas.
  if (filtros.vencimiento === 'vencidas') {
    condiciones.push(`t.fecha_entrega < NOW()`);
    condiciones.push(`t.estado <> 'completada'`);
  }

  return { where: condiciones.join(' AND '), params };
}

// Lista tareas con filtros, orden y paginación; devuelve también el total.
export async function listar(usuarioId, filtros) {
  const { where, params } = construirFiltros(usuarioId, filtros);

  // Si el orden pedido no está en la lista blanca, se usa fecha_entrega.
  const columnaOrden = ORDEN_VALIDO[filtros.orden] || 't.fecha_entrega';
  const direccion = filtros.dir === 'desc' ? 'DESC' : 'ASC';

  // Paginación opcional: solo si se envió "limit".
  let paginacion = '';
  const paramsListar = [...params]; // copia: el conteo usa los params sin limit/offset
  if (filtros.limit) {
    paramsListar.push(filtros.limit);
    paginacion += ` LIMIT $${paramsListar.length}`;
    const page = filtros.page || 1;
    // OFFSET = cuántas filas saltar según la página.
    paramsListar.push((page - 1) * filtros.limit);
    paginacion += ` OFFSET $${paramsListar.length}`;
  }

  // Página de resultados.
  const { rows } = await query(
    `SELECT ${CAMPOS}
     FROM tareas t
     JOIN cursos c ON c.id = t.curso_id
     WHERE ${where}
     ORDER BY ${columnaOrden} ${direccion}
     ${paginacion}`,
    paramsListar,
  );

  // Total de tareas que cumplen los filtros (sin paginar), para calcular el número de páginas.
  const { rows: [conteo] } = await query(
    `SELECT COUNT(*)::int AS total
     FROM tareas t
     JOIN cursos c ON c.id = t.curso_id
     WHERE ${where}`,
    params,
  );

  return { datos: rows, total: conteo.total };
}

// Busca una tarea por id e incluye el id del dueño (para verificar propiedad en el servicio).
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

// Inserta una tarea. Si no viene estado, COALESCE usa 'pendiente'.
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

// Actualiza solo los campos recibidos, armando el SET dinámicamente.
export async function actualizar(id, campos) {
  // Lista blanca de columnas editables: los nombres vienen de aquí, no del cliente.
  const columnas = {
    curso_id: 'curso_id',
    titulo: 'titulo',
    descripcion: 'descripcion',
    fecha_entrega: 'fecha_entrega',
    prioridad: 'prioridad',
    estado: 'estado',
  };

  const asignaciones = []; // fragmentos como "titulo = $1"
  const valores = []; // valores de cada placeholder
  let i = 1;

  for (const [clave, valor] of Object.entries(campos)) {
    asignaciones.push(`${columnas[clave]} = $${i}`);
    valores.push(valor);
    i += 1;
  }

  // El id va como último parámetro (el trigger de la BD actualiza actualizado_en).
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

// Cambia solo el estado de una tarea.
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

// Elimina una tarea. Devuelve true si borró una fila.
export async function eliminar(id) {
  const { rowCount } = await query('DELETE FROM tareas WHERE id = $1', [id]);
  return rowCount > 0;
}

/**
 * Estadisticas del usuario autenticado para el panel de resumen.
 */
export async function estadisticas(usuarioId) {
  // 1) Totales: COUNT(*) FILTER cuenta solo las filas que cumplen cada condición.
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

  // 2) Progreso por curso: total de tareas y cuántas están completadas.
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

  // 3) Las 5 próximas entregas pendientes (fecha futura, no completadas).
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
