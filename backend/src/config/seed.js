import bcrypt from 'bcrypt';
import { query, closePool } from './database.js';

/**
 * Inserta datos de prueba. Es idempotente: elimina y recrea la
 * cuenta de demostracion para poder ejecutarse varias veces.
 */
async function seed() {
  const correo = 'demo@taskedu.com';
  const passwordHash = await bcrypt.hash('Demo1234', 10);

  await query('DELETE FROM usuarios WHERE correo = $1', [correo]);

  const { rows: [usuario] } = await query(
    `INSERT INTO usuarios (nombre, correo, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id`,
    ['Estudiante Demo', correo, passwordHash],
  );

  const cursos = [
    ['Matematicas Discretas', 'Ing. Lopez', 'Logica y conjuntos'],
    ['Programacion Web', 'Ing. Perez', 'Backend y frontend'],
    ['Bases de Datos', 'Ing. Gomez', 'Modelado relacional'],
  ];

  const cursoIds = [];
  for (const [nombre, docente, descripcion] of cursos) {
    const { rows: [curso] } = await query(
      `INSERT INTO cursos (usuario_id, nombre, docente, descripcion)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [usuario.id, nombre, docente, descripcion],
    );
    cursoIds.push(curso.id);
  }

  const ahora = Date.now();
  const dia = 24 * 60 * 60 * 1000;
  const tareas = [
    [cursoIds[0], 'Taller de conjuntos', 'Resolver ejercicios 1 al 10', ahora + 3 * dia, 'alta', 'pendiente'],
    [cursoIds[0], 'Parcial de logica', 'Estudiar proposiciones', ahora - 2 * dia, 'alta', 'en_progreso'],
    [cursoIds[1], 'API REST de practica', 'Implementar endpoints', ahora + 5 * dia, 'media', 'pendiente'],
    [cursoIds[1], 'Maquetacion con React', 'Crear componentes base', ahora + 10 * dia, 'baja', 'pendiente'],
    [cursoIds[2], 'Modelo entidad-relacion', 'Disenar diagrama', ahora - 1 * dia, 'media', 'completada'],
  ];

  for (const t of tareas) {
    await query(
      `INSERT INTO tareas (curso_id, titulo, descripcion, fecha_entrega, prioridad, estado)
       VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5, $6)`,
      t,
    );
  }

  console.log(`Datos de prueba insertados.`);
  console.log(`Usuario: ${correo}`);
  console.log('Contrasena: Demo1234');
}

seed()
  .catch((error) => {
    console.error('Error al insertar datos de prueba:', error.message);
    process.exitCode = 1;
  })
  .finally(() => closePool());
