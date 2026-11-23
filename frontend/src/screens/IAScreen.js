import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Icon from '../components/Icon';
import OrganizadorAcademico from '../components/ia/OrganizadorAcademico';
import TutorAcademico from '../components/ia/TutorAcademico';
import { iaApi } from '../api';
import { Badge, EncabezadoPagina, colors } from '../ui';

function BotonSeccion({ activo, icono, titulo, descripcion, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: 270,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: activo ? colors.tinta : colors.borde,
        backgroundColor: activo ? colors.tinta : colors.superficie,
        opacity: pressed ? 0.86 : 1,
      })}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: activo ? 'rgba(255,255,255,0.14)' : colors.primarioClaro,
        }}
      >
        <Icon nombre={icono} tamano={19} color={activo ? '#fff' : colors.primario} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: activo ? '#fff' : colors.tinta }}>{titulo}</Text>
        <Text
          style={{
            fontSize: 11,
            lineHeight: 15,
            marginTop: 1,
            color: activo ? 'rgba(255,255,255,0.72)' : colors.textoSuave,
          }}
        >
          {descripcion}
        </Text>
      </View>
    </Pressable>
  );
}

export default function IAScreen({ focused }) {
  const { width } = useWindowDimensions();
  const dosColumnas = width >= 900;
  const [seccion, setSeccion] = useState('organizador');
  const [estadoIa, setEstadoIa] = useState(null);

  useEffect(() => {
    let activo = true;
    if (!focused) return () => { activo = false; };

    iaApi
      .estado()
      .then((datos) => {
        if (activo) setEstadoIa(datos);
      })
      .catch(() => {
        if (activo) setEstadoIa({ disponible: false });
      });

    return () => {
      activo = false;
    };
  }, [focused]);

  const iaDisponible = Boolean(estadoIa?.disponible);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center' }}>
        <EncabezadoPagina
          titulo="IA Académica"
          subtitulo="Organiza tu estudio y resuelve dudas con apoyo inteligente"
        >
          {estadoIa ? (
            <Badge color={iaDisponible ? 'verde' : 'ambar'}>
              {iaDisponible ? 'IA conectada' : 'Modo basico'}
            </Badge>
          ) : (
            <Badge color="primario">IA Academica</Badge>
          )}
        </EncabezadoPagina>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          <BotonSeccion
            activo={seccion === 'organizador'}
            icono="calendario"
            titulo="Organizador Académico Inteligente"
            descripcion="Analiza fechas, prioridades y tareas pendientes."
            onPress={() => setSeccion('organizador')}
          />
          <BotonSeccion
            activo={seccion === 'tutor'}
            icono="birrete"
            titulo="Tutor Académico Inteligente"
            descripcion="Practica con cinco preguntas y resuelve dudas."
            onPress={() => setSeccion('tutor')}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#fde7bd',
            backgroundColor: '#fff8ea',
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 13,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffefc9',
            }}
          >
            <Icon nombre="rayo" tamano={18} color="#e09400" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#7c4a03' }}>
              {iaDisponible ? 'Asistente conectado' : 'Asistente en modo basico'}
            </Text>
            <Text style={{ fontSize: 12, lineHeight: 17, color: '#9a6a12' }}>
              {iaDisponible
                ? 'La IA consulta solo tus cursos y tareas. Las preguntas y respuestas no se guardan.'
                : 'Gemini no esta disponible en este momento. El organizador usara el plan basico y el tutor puede fallar.'}
            </Text>
          </View>
        </View>

        <View style={{ display: seccion === 'organizador' ? 'flex' : 'none' }}>
          <OrganizadorAcademico dosColumnas={dosColumnas} focused={focused} />
        </View>
        <View style={{ display: seccion === 'tutor' ? 'flex' : 'none' }}>
          <TutorAcademico dosColumnas={dosColumnas} focused={focused} />
        </View>
      </View>
    </ScrollView>
  );
}
