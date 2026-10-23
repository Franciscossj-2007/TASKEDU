import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Isotipo de TaskEdu: cuadro redondeado azul con un check y un punto celeste.
// Es la misma geometria que generan los iconos de assets/ (icon.png, splash-icon.png).
export default function Logo({ tamano = 40 }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id="logoFondo" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3b8bff" />
          <Stop offset="1" stopColor="#0a4fd6" />
        </LinearGradient>
      </Defs>
      <Rect width="120" height="120" rx="30" fill="url(#logoFondo)" />
      <Path
        d="M34 62 L52 80 L86 42"
        stroke="#ffffff"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="90" cy="27" r="7" fill="#7dd3fc" />
    </Svg>
  );
}
