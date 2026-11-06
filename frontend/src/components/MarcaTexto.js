import { useId } from 'react';
import { Platform, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text } from 'react-native-svg';
import { ATARDECER } from './Degradado';

const FUENTE = Platform.select({
  web: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

// Logotipo de texto "taskedu" relleno con el degradado Atardecer (o blanco).
export default function MarcaTexto({ tamano = 30, blanco = false }) {
  const id = `marca${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const ancho = Math.round(tamano * 3.9);
  const alto = Math.round(tamano * 1.3);
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="taskedu" style={{ width: ancho, height: alto }}>
      <Svg width={ancho} height={alto}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            {ATARDECER.map((c, i) => (
              <Stop key={c} offset={i / (ATARDECER.length - 1)} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Text
          x="0"
          y={tamano}
          fontSize={tamano}
          fontWeight="800"
          fontFamily={FUENTE}
          letterSpacing={-tamano * 0.04}
          fill={blanco ? '#ffffff' : `url(#${id})`}
        >
          taskedu
        </Text>
      </Svg>
    </View>
  );
}
