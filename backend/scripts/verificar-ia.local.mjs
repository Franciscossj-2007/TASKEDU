/**
 * Verificación local del servicio de IA sin PostgreSQL ni llamadas reales.
 * Uso: node scripts/verificar-ia.local.mjs
 *
 * Sustituye globalThis.fetch por un productor controlado: ninguna petición
 * sale de la máquina. No lee ni modifica el archivo .env real.
 */
process.env.NODE_ENV = 'test';
process.env.DB_USER = process.env.DB_USER || 'local';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'local';
process.env.DB_NAME = process.env.DB_NAME || 'local';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'local-de-prueba';
process.env.GEMINI_API_KEY = 'CLAVE_DE_PRUEBA_NO_REAL';
process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
process.env.GEMINI_TIMEOUT_MS = '25000'; // el servicio debe acotarlo a 20 s

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { env } = await import('../src/config/env.js');
const gemini = await import('../src/services/gemini.service.js');

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/';
const CLAVE = process.env.GEMINI_API_KEY;
const fetchOriginal = globalThis.fetch;
const solicitudes = [];
const registros = [];

function json(status, cuerpo) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function respuestaValida(texto = '{"texto":"hola"}') {
  return json(200, {
    candidates: [{ content: { parts: [{ text: texto }] } }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
  });
}

function instalarFetch(productor) {
  solicitudes.length = 0;
  globalThis.fetch = async (url, opciones) => {
    solicitudes.push({ url, opciones });
    return productor(solicitudes.length, url, opciones);
  };
}

function capturarConsola() {
  const originales = {
    info: console.info,
    warn: console.warn,
    error: console.error,
  };
  console.info = console.warn = console.error = (...args) => {
    registros.push(args.map((valor) => String(valor)).join(' '));
  };
  return () => Object.assign(console, originales);
}

const opcion = {
  operacion: 'prueba-local',
  sistema: 'Sistema de prueba',
  instruccion: 'DATOS_SENSIBLES_DEL_ESTUDIANTE',
  maxOutputTokens: 200,
};

async function caso(nombre, fn) {
  await fn();
  console.log(`OK - ${nombre}`);
}

try {
  await caso('503 inicial se recupera con un solo reintento', async () => {
    instalarFetch((n) => (n === 1 ? json(503, { error: { message: 'secreto del proveedor' } }) : respuestaValida()));

    const resultado = await gemini.generarJson(opcion);

    assert.deepEqual(resultado.datos, { texto: 'hola' });
    assert.equal(resultado.uso.totalTokenCount, 15);
    assert.equal(solicitudes.length, 2);
    assert.ok(solicitudes.every((s) => s.url.startsWith(BASE_URL) && s.url.includes(':generateContent')));
    assert.ok(!solicitudes.some((s) => s.url.includes('/models/') && !s.url.includes(':')));
    assert.equal(solicitudes[0].opciones.headers['x-goog-api-key'], CLAVE);
  });

  await caso('503 persistente falla con mensaje seguro tras dos intentos', async () => {
    instalarFetch(() => json(503, { error: { message: 'secreto del proveedor' } }));

    await assert.rejects(
      () => gemini.generarJson(opcion),
      (error) => error.status === 503 && /no está disponible/.test(error.message) && !/secreto/.test(error.message),
    );
    assert.equal(solicitudes.length, 2);
  });

  await caso('timeout se reporta como 504 y se reintenta una sola vez', async () => {
    instalarFetch(() => {
      const error = new Error('abortada por prueba');
      error.name = 'AbortError';
      throw error;
    });

    await assert.rejects(
      () => gemini.generarJson(opcion),
      (error) => error.status === 504 && /tardó demasiado/.test(error.message),
    );
    assert.equal(solicitudes.length, 2);
  });

  await caso('JSON inválido se reintenta dentro del mismo presupuesto', async () => {
    instalarFetch((n) => (n === 1 ? respuestaValida('esto no es json') : respuestaValida()));

    const resultado = await gemini.generarJson(opcion);

    assert.deepEqual(resultado.datos, { texto: 'hola' });
    assert.equal(solicitudes.length, 2);
  });

  await caso('429 de cuota no se reintenta para no agravar el límite', async () => {
    instalarFetch(() => json(429, { error: { message: 'cuota agotada' } }));

    await assert.rejects(
      () => gemini.generarJson(opcion),
      (error) => error.status === 429 && /cuota/.test(error.message),
    );
    assert.equal(solicitudes.length, 1);
  });

  await caso('sin clave no se intenta ninguna petición', async () => {
    const claveOriginal = env.ia.apiKey;
    env.ia.apiKey = '';
    instalarFetch(() => {
      throw new Error('no debería llamarse');
    });

    assert.equal(gemini.configurado(), false);
    assert.equal((await gemini.verificarModelo()).disponible, false);
    await assert.rejects(() => gemini.generarJson(opcion), (error) => error.status === 503);
    assert.equal(solicitudes.length, 0);

    env.ia.apiKey = claveOriginal;
  });

  await caso('los logs no exponen clave, prompt ni mensaje del proveedor', async () => {
    const entornoOriginal = env.nodeEnv;
    env.nodeEnv = 'development';
    registros.length = 0;
    const restaurar = capturarConsola();
    instalarFetch(() => json(503, { error: { message: 'secreto del proveedor' } }));

    try {
      await assert.rejects(() => gemini.generarJson(opcion));
    } finally {
      restaurar();
      env.nodeEnv = entornoOriginal;
    }

    const salida = registros.join('\n');
    assert.ok(salida.includes('[IA] prueba-local reintentando'), `Salida de logs: ${salida}`);
    assert.ok(salida.includes('codigo=SERVICIO_NO_DISPONIBLE estado=503'));
    assert.ok(salida.includes('intento=1'));
    assert.ok(!salida.includes(CLAVE));
    assert.ok(!salida.includes('DATOS_SENSIBLES_DEL_ESTUDIANTE'));
    assert.ok(!salida.includes('secreto del proveedor'));
  });

  await caso('se conservan las cinco preguntas cortas y el selector de nivel', async () => {
    const codigo = await readFile(new URL('../src/services/ia.service.js', import.meta.url), 'utf8');
    const validador = await readFile(new URL('../src/validators/ia.validator.js', import.meta.url), 'utf8');

    assert.match(codigo, /CANTIDAD_PREGUNTAS = 5/);
    assert.match(codigo, /MAX_PALABRAS_PREGUNTA = 15/);
    assert.match(codigo, /primaria:/);
    assert.match(codigo, /secundaria:/);
    assert.match(codigo, /superior:/);
    assert.match(validador, /\['primaria', 'secundaria', 'superior'\]/);
  });
} finally {
  globalThis.fetch = fetchOriginal;
}

console.log('Verificación local de IA completada (sin PostgreSQL ni Gemini real).');
