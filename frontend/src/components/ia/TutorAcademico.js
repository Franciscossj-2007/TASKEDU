import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Icon from '../Icon';
import { cursosApi, iaApi, mensajeError } from '../../api';
import {
  Badge,
  Button,
  Chip,
  ErrorMsg,
  Field,
  Loading,
  SelectCampo,
  Vacio,
  colors,
  s,
} from '../../ui';

const NIVEL_POR_DEFECTO = 'superior';
const NIVELES_ACADEMICOS = [
  { valor: 'primaria', etiqueta: 'Primaria' },
  { valor: 'secundaria', etiqueta: 'Secundaria' },
  { valor: 'superior', etiqueta: 'Educación superior' },
];

function FilaPregunta({ pregunta, indice, activa, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: activa ? colors.primarioBorde : colors.borde,
        backgroundColor: activa ? colors.primarioClaro : pressed ? colors.grisClaro : colors.superficie,
      })}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: activa ? colors.primario : colors.hundido,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '800', color: activa ? '#fff' : colors.textoSuave }}>{indice + 1}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, fontWeight: activa ? '700' : '600', color: colors.texto }}>
        {pregunta.texto}
      </Text>
      <Icon nombre="derecha" tamano={16} color={activa ? colors.primario : colors.placeholder} />
    </Pressable>
  );
}

export default function TutorAcademico({ dosColumnas, focused }) {
  const [cursos, setCursos] = useState([]);
  const [cargandoCursos, setCargandoCursos] = useState(true);
  const [errorCursos, setErrorCursos] = useState('');
  const [curso, setCurso] = useState('');
  const [nivel, setNivel] = useState(NIVEL_POR_DEFECTO);
  const [tema, setTema] = useState('');
  const [temasSugeridos, setTemasSugeridos] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [respuesta, setRespuesta] = useState(null);
  const [cargandoRespuesta, setCargandoRespuesta] = useState(false);
  const [duda, setDuda] = useState('');
  const [respuestaDuda, setRespuestaDuda] = useState('');
  const [cargandoDuda, setCargandoDuda] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState('');
  const solicitudPreguntas = useRef(0);
  const solicitudRespuesta = useRef(0);
  const solicitudDuda = useRef(0);

  const cargarCursos = useCallback(async () => {
    setCargandoCursos(true);
    setErrorCursos('');
    try {
      const res = await cursosApi.listar();
      const lista = res.cursos ?? [];
      setCursos(lista);
      setCurso((actual) => {
        if (actual && lista.some((item) => String(item.id) === String(actual))) return actual;
        return lista[0] ? String(lista[0].id) : '';
      });
    } catch (e) {
      setErrorCursos(mensajeError(e));
    } finally {
      setCargandoCursos(false);
    }
  }, []);

  useEffect(() => {
    if (focused) cargarCursos();
  }, [focused, cargarCursos]);

  useEffect(() => {
    let activo = true;
    if (!focused || !curso) {
      setTemasSugeridos([]);
      return () => {
        activo = false;
      };
    }

    cursosApi
      .tareas(curso)
      .then((res) => {
        if (!activo) return;
        const titulos = (res.tareas ?? [])
          .map((tarea) => String(tarea.titulo).trim())
          .filter(Boolean);
        setTemasSugeridos([...new Set(titulos)].slice(0, 4));
      })
      .catch(() => {
        if (activo) setTemasSugeridos([]);
      });

    return () => {
      activo = false;
    };
  }, [curso, focused]);

  const generarPreguntas = useCallback(async (temaObjetivo, cursoObjetivo, nivelObjetivo = NIVEL_POR_DEFECTO) => {
    const limpio = String(temaObjetivo || '').trim();
    const cursoId = Number(cursoObjetivo);
    const nivelElegido = NIVELES_ACADEMICOS.some((opcion) => opcion.valor === nivelObjetivo)
      ? nivelObjetivo
      : NIVEL_POR_DEFECTO;
    if (!cursoId || limpio.length < 3) return;

    const solicitud = solicitudPreguntas.current + 1;
    solicitudPreguntas.current = solicitud;
    setGenerando(true);
    setError('');
    setPreguntas([]);
    setSeleccionada(null);
    setRespuesta(null);
    setRespuestaDuda('');
    setDuda('');

    try {
      const res = await iaApi.preguntas({ curso_id: cursoId, tema: limpio, nivel: nivelElegido });
      if (solicitud !== solicitudPreguntas.current) return;
      setPreguntas(res.preguntas ?? []);
    } catch (e) {
      if (solicitud === solicitudPreguntas.current) setError(mensajeError(e));
    } finally {
      if (solicitud === solicitudPreguntas.current) setGenerando(false);
    }
  }, []);

  const cursoActual = cursos.find((item) => String(item.id) === String(curso))?.nombre ?? '';
  const temaActual = tema.trim() || 'el tema seleccionado';
  const opcionesCursos = cursos.map((item) => ({ valor: String(item.id), etiqueta: item.nombre }));

  function descartarResultados() {
    solicitudPreguntas.current += 1;
    solicitudRespuesta.current += 1;
    solicitudDuda.current += 1;
    setGenerando(false);
    setCargandoRespuesta(false);
    setCargandoDuda(false);
    setPreguntas([]);
    setSeleccionada(null);
    setRespuesta(null);
    setRespuestaDuda('');
    setDuda('');
    setError('');
  }

  function cambiarCurso(valor) {
    setCurso(valor);
    setTema('');
    setTemasSugeridos([]);
    descartarResultados();
  }

  function cambiarTema(texto) {
    setTema(texto);
    descartarResultados();
  }

  function cambiarNivel(valor) {
    setNivel(valor);
    descartarResultados();
  }

  async function seleccionarPregunta(pregunta) {
    if (!curso) return;

    const solicitud = solicitudRespuesta.current + 1;
    solicitudRespuesta.current = solicitud;
    setSeleccionada(pregunta);
    setRespuesta(null);
    setRespuestaDuda('');
    setCargandoRespuesta(true);
    setError('');

    try {
      const res = await iaApi.responder({
        curso_id: Number(curso),
        tema: tema.trim(),
        pregunta: pregunta.texto,
        nivel,
      });
      if (solicitud === solicitudRespuesta.current) setRespuesta(res);
    } catch (e) {
      if (solicitud === solicitudRespuesta.current) setError(mensajeError(e));
    } finally {
      if (solicitud === solicitudRespuesta.current) setCargandoRespuesta(false);
    }
  }

  async function enviarDuda() {
    if (!curso || !duda.trim()) return;

    const solicitud = solicitudDuda.current + 1;
    solicitudDuda.current = solicitud;
    setCargandoDuda(true);
    setError('');

    try {
      const res = await iaApi.duda({
        curso_id: Number(curso),
        tema: tema.trim(),
        duda: duda.trim(),
        pregunta: seleccionada?.texto,
        nivel,
      });
      if (solicitud === solicitudDuda.current) setRespuestaDuda(res.respuesta ?? '');
    } catch (e) {
      if (solicitud === solicitudDuda.current) setError(mensajeError(e));
    } finally {
      if (solicitud === solicitudDuda.current) setCargandoDuda(false);
    }
  }

  if (cargandoCursos) {
    return (
      <View style={[s.tarjeta, { marginBottom: 0 }]}>
        <Loading />
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textoSuave, textAlign: 'center' }}>
          Cargando tus cursos...
        </Text>
      </View>
    );
  }

  if (!errorCursos && cursos.length === 0) {
    return (
      <View style={[s.tarjeta, { marginBottom: 0 }]}>
        <Vacio
          icono="birrete"
          titulo="Aún no tienes cursos"
          mensaje="Crea un curso en la sección Cursos para practicar con el tutor académico."
        />
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {errorCursos ? <ErrorMsg titulo="No se pudieron cargar los cursos">{errorCursos}</ErrorMsg> : null}
      {error ? <ErrorMsg titulo="No se pudo completar la consulta">{error}</ErrorMsg> : null}

      <View style={{ flexDirection: dosColumnas ? 'row' : 'column', alignItems: 'flex-start', gap: 14 }}>
        <View style={{ width: dosColumnas ? undefined : '100%', flex: dosColumnas ? 0.9 : undefined, gap: 14 }}>
          <View style={[s.tarjeta, { marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primarioClaro,
                }}
              >
                <Icon nombre="birrete" tamano={21} color={colors.primario} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.seccionTitulo, { fontSize: 18 }]}>Configura tu tutor</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textoSuave, marginTop: 2 }}>
                  Elige un curso, el nivel y un tema de estudio
                </Text>
              </View>
            </View>

            <SelectCampo
              label="Curso"
              value={curso}
              opciones={opcionesCursos}
              onChange={cambiarCurso}
              placeholder="Selecciona un curso"
              requerido
            />
            <SelectCampo
              label="Nivel académico"
              value={nivel}
              opciones={NIVELES_ACADEMICOS}
              onChange={cambiarNivel}
              requerido
            />
            <Field
              label="Tema"
              requerido
              value={tema}
              onChangeText={cambiarTema}
              placeholder="Escribe un tema del curso"
              ayuda="Las preguntas se generan solo al pulsar el botón."
            />

            {temasSugeridos.length ? (
              <>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textoSuave, marginBottom: 8 }}>
                  Temas sugeridos del curso
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
                  {temasSugeridos.map((sugerido) => (
                    <Chip
                      key={sugerido}
                      label={sugerido}
                      active={tema === sugerido}
                      onPress={() => cambiarTema(sugerido)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <Button
              title={generando ? 'Generando preguntas' : 'Generar 5 preguntas'}
              icono="chispa"
              bloque
              cargando={generando}
              onPress={() => generarPreguntas(tema, curso, nivel)}
              disabled={!curso || tema.trim().length < 3}
            />

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12 }}>
              <Icon nombre="candado" tamano={15} color={colors.textoSuave} />
              <Text style={{ flex: 1, fontSize: 11, lineHeight: 16, color: colors.textoSuave }}>
                Las preguntas y respuestas son solo para esta sesión. No se guardan en la base de datos.
              </Text>
            </View>
          </View>

          <View style={[s.tarjeta, { marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Text style={[s.seccionTitulo, { flex: 1, fontSize: 17 }]}>¿Qué más necesitas saber?</Text>
              <Badge color="gris">Pregunta libre</Badge>
            </View>
            <Text style={{ fontSize: 12, lineHeight: 17, color: colors.textoSuave, marginBottom: 10 }}>
              Pregunta lo que no te haya quedado claro sobre {temaActual}.
            </Text>
            <Field
              value={duda}
              onChangeText={setDuda}
              placeholder="Escribe tu pregunta libre"
              multiline
            />
            <Button
              title={cargandoDuda ? 'Consultando' : 'Preguntar'}
              icono="flecha"
              kind="secundario"
              small
              cargando={cargandoDuda}
              onPress={enviarDuda}
              disabled={!curso || !duda.trim()}
            />
            {respuestaDuda ? (
              <View style={{ marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: colors.hundido }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.tinta, marginBottom: 4 }}>
                  Respuesta del tutor
                </Text>
                <Text style={{ fontSize: 13, lineHeight: 19, color: colors.texto }}>{respuestaDuda}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ width: dosColumnas ? undefined : '100%', flex: dosColumnas ? 1.4 : undefined, gap: 14 }}>
          <View style={[s.tarjeta, { marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={[s.seccionTitulo, { flex: 1, fontSize: 17 }]}>Preguntas sugeridas</Text>
              {cursoActual ? <Badge color="primario">{cursoActual}</Badge> : null}
            </View>
            <Text style={{ fontSize: 12, lineHeight: 17, color: colors.textoSuave, marginBottom: 12 }}>
              Selecciona una pregunta para ver la explicación del tutor sobre {temaActual}.
            </Text>

            {generando ? (
              <View style={{ gap: 10 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <View
                    key={n}
                    style={{
                      height: 54,
                      borderRadius: 16,
                      backgroundColor: colors.hundido,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingHorizontal: 12,
                    }}
                  >
                    <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.grisClaro }} />
                    <View style={{ flex: 1, height: 10, borderRadius: 999, backgroundColor: colors.grisClaro }} />
                  </View>
                ))}
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textoSuave, textAlign: 'center' }}>
                  Preparando preguntas con Gemini...
                </Text>
              </View>
            ) : preguntas.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 12 }}>
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 19,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primarioClaro,
                    marginBottom: 10,
                  }}
                >
                  <Icon nombre="chispa" tamano={25} color={colors.primario} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.tinta, textAlign: 'center', marginBottom: 4 }}>
                  Genera preguntas para este tema
                </Text>
                <Text style={{ fontSize: 12, lineHeight: 17, color: colors.textoSuave, textAlign: 'center' }}>
                  Escribe un tema de al menos 3 caracteres y el tutor preparará cinco preguntas.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {preguntas.map((pregunta, indice) => (
                  <FilaPregunta
                    key={pregunta.id}
                    pregunta={pregunta}
                    indice={indice}
                    activa={seleccionada?.id === pregunta.id}
                    onPress={() => seleccionarPregunta(pregunta)}
                  />
                ))}
              </View>
            )}
          </View>

          {seleccionada ? (
            <View style={[s.tarjeta, { marginBottom: 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 13,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primarioClaro,
                  }}
                >
                  <Icon nombre="birrete" tamano={19} color={colors.primario} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: colors.tinta }}>Respuesta del tutor</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textoSuave, marginTop: 2 }}>
                    {cursoActual} · {temaActual}
                  </Text>
                </View>
                <Badge color="verde">Gemini</Badge>
              </View>

              {cargandoRespuesta ? (
                <Loading />
              ) : respuesta ? (
                <>
                  <Text style={{ fontSize: 13, lineHeight: 20, color: colors.texto }}>{respuesta.respuesta}</Text>
                  {respuesta.ideaClave ? (
                    <View style={{ marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: colors.primarioClaro }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primarioOscuro, marginBottom: 3 }}>
                        Idea clave
                      </Text>
                      <Text style={{ fontSize: 12, lineHeight: 18, color: colors.primarioOscuro }}>
                        {respuesta.ideaClave}
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={{ fontSize: 12, color: colors.textoSuave }}>
                  La explicación aparecerá aquí.
                </Text>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
