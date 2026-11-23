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

const tareaVencida = {
  id: 2,
  titulo: 'Informe de laboratorio',
  curso_nombre: 'Física',
  fecha_entrega: new Date(Date.now() - 86400000).toISOString(),
  prioridad: 'media',
  estado: 'pendiente',
  vencida: true,
};

const tareaEnProgreso = {
  id: 3,
  titulo: 'Resumen de biología',
  curso_nombre: 'Biología',
  fecha_entrega: new Date(Date.now() + 2 * 86400000).toISOString(),
  prioridad: 'baja',
  estado: 'en_progreso',
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
      pendientes: 2,
      en_progreso: 1,
      completadas: 1,
      total: 4,
      vencidas: 1,
      proximas: 2,
    }),
    listar: async (_usuarioId, opciones = {}) => ({
      datos: opciones.estado === 'en_progreso' ? [tareaEnProgreso] : [tarea, tareaVencida],
    }),
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
      plan: [
        { tarea_id: 1, motivo: 'Entrega próxima' },
        { tarea_id: 3, motivo: 'Continúa donde quedaste' },
      ],
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

test('Organizador básico ordena tareas reales por urgencia y fecha de entrega', async () => {
  simularFetch([fallo503(), fallo503()]);

  const resultado = await ia.organizador(1);

  assert.equal(resultado.fuente, 'basico');
  assert.deepEqual(
    resultado.plan.map((item) => item.id),
    [tareaVencida.id, tarea.id, tareaEnProgreso.id],
  );
  assert.equal(resultado.plan[0].motivo, 'Entrega vencida: conviene resolverla primero');
  assert.ok(resultado.plan.every((item) => typeof item.titulo === 'string' && item.titulo.length));
});

test('Tutor entrega preguntas guía del tema en modo básico sin inventar respuestas', async () => {
  const solicitudes = simularFetch([fallo503(), fallo503()]);

  const resultado = await ia.preguntasTutor(1, {
    curso_id: 1,
    tema: 'funciones trigonométricas',
    nivel: 'superior',
  });

  assert.equal(resultado.fuente, 'basico');
  assert.equal(resultado.modoBasico, true);
  assert.equal(resultado.esGeneradoPorIA, false);
  assert.match(resultado.aviso, /preguntas guía/);
  assert.match(resultado.aviso, /no son respuestas generadas por IA/);
  assert.equal(resultado.preguntas.length, 5);
  for (const pregunta of resultado.preguntas) {
    assert.match(pregunta.texto, /funciones trigonométricas/);
    assert.ok(pregunta.texto.split(/\s+/).filter(Boolean).length <= 15);
    assert.equal(pregunta.respuesta, undefined);
  }
  // Solo los dos intentos controlados de Gemini: no hay reintentos automáticos extra.
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_PRINCIPAL, MODELO_RESPALDO],
  );
});

test('Tutor mantiene el nivel elegido en las preguntas guía del modo básico', async () => {
  simularFetch([fallo503(), fallo503()]);

  const primaria = await ia.preguntasTutor(1, { curso_id: 1, tema: 'las plantas', nivel: 'primaria' });
  const superior = await ia.preguntasTutor(1, { curso_id: 1, tema: 'las plantas', nivel: 'superior' });

  assert.equal(primaria.nivel, 'primaria');
  assert.equal(superior.nivel, 'superior');
  assert.notDeepEqual(
    primaria.preguntas.map((pregunta) => pregunta.texto),
    superior.preguntas.map((pregunta) => pregunta.texto),
  );
});
