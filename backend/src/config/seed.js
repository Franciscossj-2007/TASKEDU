// Librería para cifrar contraseñas.
import bcrypt from 'bcrypt';
import { query, closePool } from './database.js';

/**
 * Inserta datos de prueba. Es idempotente: elimina y recrea la
 * cuenta de demostracion para poder ejecutarse varias veces.
 */
async function seed() {
  const correo = 'demo@taskedu.com';
  // Cifra la contraseña de demostración (10 = rondas de sal).
  const passwordHash = await bcrypt.hash('Demo1234', 10);

  // Borra el usuario demo anterior; ON DELETE CASCADE elimina sus cursos y tareas.
  await query('DELETE FROM usuarios WHERE correo = $1', [correo]);

  // Inserta el usuario demo y recupera su id generado.
  const { rows: [usuario] } = await query(
    `INSERT INTO usuarios (nombre, correo, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id`,
    ['Estudiante Demo', correo, passwordHash],
  );

  // Cursos de ejemplo: [nombre, docente, descripción].
  const cursos = [
    ['Matematicas Discretas', 'Ing. Lopez', 'Logica y conjuntos'],
    ['Programacion Web', 'Ing. Perez', 'Backend y frontend'],
    ['Bases de Datos', 'Ing. Gomez', 'Modelado relacional'],
  ];

  // Guarda los ids de los cursos creados para asignarles tareas.
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

  // Fechas relativas a "ahora" para que siempre haya tareas vencidas y próximas.
  const ahora = Date.now();
  const dia = 24 * 60 * 60 * 1000; // un día en milisegundos
  // Tareas de ejemplo: [curso, título, descripción, fecha (ms), prioridad, estado].
  const tareas = [
    [cursoIds[0], 'Taller de conjuntos', 'Resolver ejercicios 1 al 10', ahora + 3 * dia, 'alta', 'pendiente'],
    [cursoIds[0], 'Parcial de logica', 'Estudiar proposiciones', ahora - 2 * dia, 'alta', 'en_progreso'], // vencida
    [cursoIds[1], 'API REST de practica', 'Implementar endpoints', ahora + 5 * dia, 'media', 'pendiente'],
    [cursoIds[1], 'Maquetacion con React', 'Crear componentes base', ahora + 10 * dia, 'baja', 'pendiente'],
    [cursoIds[2], 'Modelo entidad-relacion', 'Disenar diagrama', ahora - 1 * dia, 'media', 'completada'],
  ];

  for (const t of tareas) {
    // to_timestamp convierte los milisegundos a fecha de PostgreSQL.
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
  // Pase lo que pase, cierra el pool para que el script termine.
  .finally(() => closePool());
