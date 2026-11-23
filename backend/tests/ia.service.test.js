import assert from 'node:assert/strict';
import { after, afterEach, mock, test } from 'node:test';
import { pathToFileURL } from 'node:url';

// Se configuran primero las variables de entorno y las dependencias simuladas:
// no se abre PostgreSQL y no se contacta a Gemini.
process.env.NODE_ENV = 'test';
process.env.DB_USER = 'usuario_simulado';
process.env.DB_PASSWORD = 'clave_simulada';
process.env.DB_NAME = 'base_simulada';
process.env.JWT_SECRET = 'secreto_simulado';
process.env.GEMINI_API_KEY = 'api-key-simulada';
process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
process.env.GEMINI_FALLBACK_MODEL = 'gemini-3.1-flash-lite';

const MODELO_PRINCIPAL = 'gemini-3.5-flash-lite';
const MODELO_RESPALDO = 'gemini-3.1-flash-lite';
const rutaModulo = (relativa) => pathToFileURL(`${process.cwd()}/${relativa}`).href;

const fechaEntrega = new Date(Date.now() + 86400000).toISOString();
const tarea = {
  id: 1,
  titulo: 'Ejercicios de funciones',
  curso_nombre: 'Matemáticas',
  fecha_entrega: fechaEntrega,
  prioridad: 'alta',
  estado: 'pendiente',
  vencida: false,
};

const curso = { id: 1, nombre: 'Matemáticas' };

mock.module(rutaModulo('src/repositories/cursos.repository.js'), {
  exports: {
    listarPorUsuario: async () => [curso],
  },
});

mock.module(rutaModulo('src/repositories/tareas.repository.js'), {
  exports: {
    estadisticas: async () => ({
      pendientes: 1,
      en_progreso: 0,
      completadas: 1,
      total: 2,
      vencidas: 0,
      proximas: 1,
    }),
    listar: async () => ({ datos: [tarea] }),
  },
});

mock.module(rutaModulo('src/services/cursos.service.js'), {
  exports: {
    obtener: async () => ({ curso }),
  },
});

const ia = await import('../src/services/ia.service.js');

const fetchOriginal = globalThis.fetch;

function respuesta(datos, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function fallo503() {
  return respuesta({ error: { code: 503 } }, 503);
}

function exito(datos) {
  return respuesta({
    candidates: [
      {
        content: { parts: [{ text: JSON.stringify(datos) }] },
        finishReason: 'STOP',
      },
    ],
  });
}

function modeloDe(url) {
  const ultimoSegmento = new URL(url).pathname.split('/').pop() ?? '';
  return decodeURIComponent(ultimoSegmento.split(':')[0]);
}

function simularFetch(respuestas) {
  const solicitudes = [];
  let indice = 0;

  globalThis.fetch = async (url) => {
    solicitudes.push({ modelo: modeloDe(String(url)), url: String(url) });
    const actual = respuestas[Math.min(indice, respuestas.length - 1)];
    indice += 1;
    return actual;
  };

  return solicitudes;
}

afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

after(() => {
  mock.restoreAll();
});

test('Tutor: preguntas se recuperan con el respaldo y conservan 5 preguntas breves', async () => {
  const preguntas = [
    '¿Qué es una función?',
    '¿Cómo se representa?',
    '¿Qué es el dominio?',
    '¿Y el rango?',
    '¿Cómo se evalúa?',
  ];
  const solicitudes = simularFetch([fallo503(), exito({ preguntas })]);

  const resultado = await ia.preguntasTutor(1, { curso_id: 1, tema: 'funciones', nivel: 'superior' });

  assert.equal(resultado.fuente, 'gemini');
  assert.equal(resultado.preguntas.length, 5);
  for (const pregunta of resultado.preguntas) {
    assert.ok(pregunta.texto.split(/\s+/).filter(Boolean).length <= 15);
  }
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_PRINCIPAL, MODELO_RESPALDO],
  );
});

test('Tutor: explicación de la pregunta seleccionada usa el respaldo', async () => {
  const solicitudes = simularFetch([
    fallo503(),
    exito({ respuesta: 'Una función relaciona entradas y salidas.', idea_clave: 'Relación entrada-salida' }),
  ]);

  const resultado = await ia.responderTutor(1, {
    curso_id: 1,
    tema: 'funciones',
    pregunta: '¿Qué es una función?',
    nivel: 'primaria',
  });

  assert.equal(resultado.fuente, 'gemini');
  assert.equal(resultado.respuesta, 'Una función relaciona entradas y salidas.');
  assert.equal(resultado.ideaClave, 'Relación entrada-salida');
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_PRINCIPAL, MODELO_RESPALDO],
  );
});

test('Tutor: dudas libres usan el respaldo', async () => {
  const solicitudes = simularFetch([
    fallo503(),
    exito({ respuesta: 'El dominio son los valores de entrada permitidos.' }),
  ]);

  const resultado = await ia.responderDuda(1, {
    curso_id: 1,
    tema: 'funciones',
    duda: '¿Qué valores puedo usar?',
    pregunta: '¿Qué es el dominio?',
    nivel: 'secundaria',
  });

  assert.equal(resultado.fuente, 'gemini');
  assert.match(resultado.respuesta, /valores de entrada/);
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_PRINCIPAL, MODELO_RESPALDO],
  );
});

test('Organizador usa el respaldo ante un 503 del principal', async () => {
  const solicitudes = simularFetch([
    fallo503(),
    exito({
      resumen: 'Organiza la entrega de mañana primero.',
      plan: [{ tarea_id: 1, motivo: 'Entrega próxima' }],
      recomendaciones: ['Reserva 30 minutos para repasar.'],
    }),
  ]);

  const resultado = await ia.organizador(1, { enfoque: 'repasar' });

  assert.equal(resultado.fuente, 'gemini');
  assert.equal(resultado.aviso, null);
  assert.equal(resultado.plan[0].id, tarea.id);
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_PRINCIPAL, MODELO_RESPALDO],
  );
});

test('Organizador vuelve al modo básico si ambos modelos fallan', async () => {
  const solicitudes = simularFetch([fallo503(), fallo503()]);

  const resultado = await ia.organizador(1);

  assert.equal(resultado.fuente, 'basico');
  assert.ok(resultado.aviso);
  assert.match(resultado.aviso, /organizador básico/);
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_PRINCIPAL, MODELO_RESPALDO],
  );
});
