import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Icon from '../Icon';
import { iaApi, mensajeError } from '../../api';
import {
  Badge,
  Button,
  ErrorMsg,
  Loading,
  Progreso,
  TONOS,
  Vacio,
  colors,
  metaPrioridad,
  s,
} from '../../ui';

function TarjetaIndicador({ indicador }) {
  const tono = TONOS[indicador.tono] ?? TONOS.azul;
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 150,
        gap: 8,
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: tono.borde,
        backgroundColor: tono.fondo,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 13,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tono.circulo,
          }}
        >
          <Icon nombre={indicador.icono} tamano={19} color={tono.icono} />
        </View>
        <Text style={{ fontSize: 26, lineHeight: 30, fontWeight: '800', color: colors.tinta }}>{indicador.valor}</Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '800', color: colors.tinta }}>{indicador.titulo}</Text>
      <Text style={{ fontSize: 12, lineHeight: 17, color: colors.textoSuave }}>{indicador.detalle}</Text>
    </View>
  );
}

function FilaPlan({ tarea, indice }) {
  const prioridad = metaPrioridad(tarea.prioridad);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: indice === 0 ? colors.primarioClaro : colors.hundido,
      }}
    >
      <View
        style={{
          width: 58,
          paddingVertical: 7,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: colors.superficie,
        }}
      >
        <Text style={{ fontSize: 10, fontWeight: '800', color: colors.textoSuave }}>{tarea.dia}</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.tinta }}>{tarea.hora}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.tinta }}>{tarea.titulo}</Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textoSuave }}>{tarea.curso}</Text>
        {tarea.motivo ? (
          <Text style={{ fontSize: 11, lineHeight: 16, color: colors.textoSuave }}>{tarea.motivo}</Text>
        ) : null}
      </View>
      <Badge color={prioridad.color}>{prioridad.etiqueta}</Badge>
    </View>
  );
}

export default function OrganizadorAcademico({ dosColumnas, focused }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const cargaInicial = useRef(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setDatos(await iaApi.organizador());
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (focused && !cargaInicial.current) {
      cargaInicial.current = true;
      cargar();
    }
  }, [focused, cargar]);

  if (cargando && !datos) {
    return (
      <View style={[s.tarjeta, { marginBottom: 0 }]}>
        <Loading />
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textoSuave, textAlign: 'center' }}>
          Analizando tus tareas con apoyo inteligente...
        </Text>
      </View>
    );
  }

  if (error && !datos) {
    return <ErrorMsg titulo="No se pudo generar el plan">{error}</ErrorMsg>;
  }

  const plan = datos?.plan ?? [];
  const prioridades = datos?.prioridades ?? [];
  const recomendaciones = datos?.recomendaciones ?? [];
  const avance = Number(datos?.avance) || 0;
  const esGemini = datos?.fuente === 'gemini';
  const totalPendientes = Number(datos?.totalPendientes) || 0;
  const vencidas = Number(datos?.vencidas) || 0;

  return (
    <View style={{ gap: 14 }}>
      {error ? <ErrorMsg titulo="No se pudo actualizar el plan">{error}</ErrorMsg> : null}
      {datos?.aviso ? (
        <ErrorMsg tipo="info" titulo={esGemini ? 'Aviso de la IA' : 'Organizador basico'}>
          {datos.aviso}
        </ErrorMsg>
      ) : null}

      <View style={{ flexDirection: dosColumnas ? 'row' : 'column', alignItems: 'flex-start', gap: 14 }}>
        <View style={{ width: dosColumnas ? undefined : '100%', flex: dosColumnas ? 1.35 : undefined, gap: 14 }}>
          <View style={[s.tarjeta, { marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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
                <Icon nombre="calendario" tamano={21} color={colors.primario} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.seccionTitulo, { fontSize: 18 }]}>Tu semana en perspectiva</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textoSuave, marginTop: 2 }}>
                  {totalPendientes} tareas pendientes · {vencidas} vencidas
                </Text>
              </View>
              <Badge color={esGemini ? 'verde' : 'ambar'}>
                {esGemini ? 'Gemini' : 'Modo basico'}
              </Badge>
            </View>

            <Text style={{ fontSize: 14, lineHeight: 21, color: colors.texto, marginBottom: 14 }}>
              {datos?.resumen}
            </Text>

            <Progreso valor={avance} max={100} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textoSuave }}>Progreso general</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primario }}>{avance} de 100</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <Text style={{ flex: 1, fontSize: 11, lineHeight: 16, color: colors.textoSuave }}>
                {esGemini
                  ? 'Plan generado con tus tareas reales.'
                  : 'Plan generado localmente. La IA no estaba disponible.'}
              </Text>
              <Button kind="secundario" small title="Actualizar plan" icono="rayo" onPress={cargar} cargando={cargando} />
            </View>
          </View>

          <View style={[s.tarjeta, { marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={[s.seccionTitulo, { flex: 1, fontSize: 17 }]}>Plan recomendado</Text>
              <Badge color="gris">Orden sugerido</Badge>
            </View>
            <Text style={{ fontSize: 12, lineHeight: 17, color: colors.textoSuave, marginBottom: 12 }}>
              Un orden sugerido según fechas, prioridad y carga de cada curso.
            </Text>
            {plan.length === 0 ? (
              <Vacio
                icono="fiesta"
                titulo="Sin tareas pendientes"
                mensaje="No hay entregas por organizar. Aprovecha para repasar o adelantar contenido."
              />
            ) : (
              <View style={{ gap: 10 }}>
                {plan.map((tarea, indice) => (
                  <FilaPlan key={tarea.id} tarea={tarea} indice={indice} />
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={{ width: dosColumnas ? undefined : '100%', flex: dosColumnas ? 1 : undefined, gap: 14 }}>
          <View style={[s.tarjeta, { marginBottom: 0 }]}>
            <Text style={[s.seccionTitulo, { fontSize: 17 }]}>Focos de atención</Text>
            <Text style={{ fontSize: 12, lineHeight: 17, color: colors.textoSuave, marginTop: 3, marginBottom: 12 }}>
              Lo que más influye en tu organización esta semana.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {prioridades.map((indicador) => (
                <TarjetaIndicador key={indicador.id} indicador={indicador} />
              ))}
            </View>
          </View>

          <View style={[s.tarjeta, { marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Icon nombre="chispa" tamano={19} color={colors.primario} />
              <Text style={[s.seccionTitulo, { fontSize: 17 }]}>Recomendaciones</Text>
            </View>
            <View style={{ gap: 12 }}>
              {recomendaciones.map((texto, indice) => (
                <View key={`${indice}-${texto}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 9,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.primarioClaro,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primarioOscuro }}>{indice + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, color: colors.texto }}>{texto}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
