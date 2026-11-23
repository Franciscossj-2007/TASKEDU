import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

// El entorno se fija antes de importar el servicio: env.js valida variables de BD.
process.env.NODE_ENV = 'test';
process.env.DB_USER = 'usuario_simulado';
process.env.DB_PASSWORD = 'clave_simulada';
process.env.DB_NAME = 'base_simulada';
process.env.JWT_SECRET = 'secreto_simulado';
process.env.GEMINI_API_KEY = 'api-key-simulada';
process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
delete process.env.GEMINI_FALLBACK_MODEL;

const gemini = await import('../src/services/gemini.service.js');

const MODELO_PRINCIPAL = 'gemini-3.5-flash-lite';
const MODELO_RESPALDO = 'gemini-3.1-flash-lite';
const fetchOriginal = globalThis.fetch;

function respuesta(datos, status = 200) {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function fallo(estado) {
  return respuesta({ error: { code: estado } }, estado);
}

function exito(datos, uso) {
  return respuesta({
    candidates: [
      {
        content: { parts: [{ text: JSON.stringify(datos) }] },
        finishReason: 'STOP',
      },
    ],
    ...(uso ? { usageMetadata: uso } : {}),
  });
}

function texto(valor) {
  return respuesta({
    candidates: [{ content: { parts: [{ text: valor }] }, finishReason: 'STOP' }],
  });
}

function modeloDe(url) {
  const ultimoSegmento = new URL(url).pathname.split('/').pop() ?? '';
  return decodeURIComponent(ultimoSegmento.split(':')[0]);
}

function simularFetch(respuestas) {
  const solicitudes = [];
  let indice = 0;

  globalThis.fetch = async (url, opciones) => {
    solicitudes.push({
      modelo: modeloDe(String(url)),
      url: String(url),
      metodo: opciones?.method ?? 'GET',
    });

    const actual = respuestas[Math.min(indice, respuestas.length - 1)];
    indice += 1;
    return typeof actual === 'function' ? actual(url, opciones) : actual;
  };

  return solicitudes;
}

function generar(operacion = 'tutor-preguntas') {
  return gemini.generarJson({
    operacion,
    sistema: 'sistema de prueba',
    instruccion: 'instruccion de prueba',
    maxOutputTokens: 100,
  });
}

afterEach(() => {
  globalThis.fetch = fetchOriginal;
  if (process.env.GEMINI_FALLBACK_MODEL !== undefined) {
    delete process.env.GEMINI_FALLBACK_MODEL;
  }
});

test('un 503 del principal se recupera con el modelo de respaldo', async () => {
  const solicitudes = simularFetch([
    fallo(503),
    exito({ ok: true }, { promptTokenCount: 3, candidatesTokenCount: 2, totalTokenCount: 5 }),
  ]);

  const { datos, uso } = await generar();

  assert.deepEqual(datos, { ok: true });
  assert.equal(uso.totalTokenCount, 5);
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_PRINCIPAL, MODELO_RESPALDO],
  );
  assert.match(solicitudes[1].url, /:generateContent$/);
});

test('429 y credenciales inválidas no activan el respaldo', async () => {
  // Las credenciales inválidas se traducen a un 503 controlado con código CREDENCIALES.
  for (const [estado, codigo, statusEsperado] of [
    [429, 'CUOTA', 429],
    [403, 'CREDENCIALES', 503],
  ]) {
    const solicitudes = simularFetch([fallo(estado)]);

    await assert.rejects(
      generar('tutor-respuesta'),
      (error) => error.codigo === codigo && error.status === statusEsperado,
    );
    assert.equal(solicitudes.length, 1);
  }
});

test('si ambos modelos devuelven 503 no hay reintentos adicionales', async () => {
  const solicitudes = simularFetch([fallo(503), fallo(503)]);

  await assert.rejects(
    generar('tutor-duda'),
    (error) => error.codigo === 'SERVICIO_NO_DISPONIBLE' && error.status === 503,
  );
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_PRINCIPAL, MODELO_RESPALDO],
  );
});

test('GEMINI_FALLBACK_MODEL vacío desactiva el respaldo', async () => {
  process.env.GEMINI_FALLBACK_MODEL = '';
  const solicitudes = simularFetch([fallo(503)]);

  await assert.rejects(
    generar('organizador'),
    (error) => error.codigo === 'SERVICIO_NO_DISPONIBLE' && error.status === 503,
  );
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_PRINCIPAL],
  );
});

test('un identificador de respaldo inválido nunca se envía al proveedor', async () => {
  process.env.GEMINI_FALLBACK_MODEL = '../modelo-no-valido';
  const solicitudes = simularFetch([fallo(503)]);

  await assert.rejects(generar(), (error) => error.codigo === 'SERVICIO_NO_DISPONIBLE');
  assert.equal(solicitudes.length, 1);
});

test('un JSON inválido se reintenta en el mismo modelo, sin cambiar de modelo', async () => {
  const solicitudes = simularFetch([texto('respuesta que no es JSON'), exito({ ok: true })]);

  const { datos } = await generar();

  assert.deepEqual(datos, { ok: true });
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_PRINCIPAL, MODELO_PRINCIPAL],
  );
});

test('verificarModelo confirma que el respaldo acepta generateContent', async () => {
  const solicitudes = simularFetch([respuesta({ supportedGenerationMethods: ['generateContent'] })]);

  const estado = await gemini.verificarModelo(MODELO_RESPALDO);

  assert.equal(estado.disponible, true);
  assert.deepEqual(
    solicitudes.map((solicitud) => solicitud.modelo),
    [MODELO_RESPALDO],
  );
});

test('verificarModelo rechaza un modelo sin generateContent', async () => {
  simularFetch([respuesta({ supportedGenerationMethods: ['embedContent'] })]);

  const estado = await gemini.verificarModelo(MODELO_RESPALDO);

  assert.equal(estado.disponible, false);
  assert.match(estado.motivo, /generateContent/);
});
