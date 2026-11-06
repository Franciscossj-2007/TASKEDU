import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Isotipo de TaskEdu: cuadro redondeado con el degradado Atardecer, un check y un punto dorado.
// "blanco" invierte los colores (cuadro blanco y check coral) para usarlo sobre fondos de color.
export default function Logo({ tamano = 40, blanco = false }) {
  const id = `logo${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ff5470" />
          <Stop offset="0.5" stopColor="#ff6b4a" />
          <Stop offset="1" stopColor="#ffb020" />
        </LinearGradient>
      </Defs>
      <Rect width="120" height="120" rx="34" fill={blanco ? '#ffffff' : `url(#${id})`} />
      <Path
        d="M34 62 L52 80 L86 42"
        stroke={blanco ? `url(#${id})` : '#ffffff'}
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="90" cy="27" r="7" fill={blanco ? '#ffb020' : '#ffe0a8'} />
    </Svg>
  );
}
