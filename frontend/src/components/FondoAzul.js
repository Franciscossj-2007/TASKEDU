import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

// Fondo de marca "Atardecer": degradado diagonal rosa -> coral -> naranja con brillos suaves.
// (Se conserva el nombre del archivo para no romper los imports existentes.)
export default function FondoAzul() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="fondoAtardecer" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ff5470" />
          <Stop offset="0.5" stopColor="#ff6b4a" />
          <Stop offset="1" stopColor="#ffb020" />
        </LinearGradient>
        <RadialGradient id="brilloDorado" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#ffe0a8" stopOpacity="0.75" />
          <Stop offset="1" stopColor="#ffe0a8" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="brilloRosa" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#ff3d6e" stopOpacity="0.6" />
          <Stop offset="1" stopColor="#ff3d6e" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="400" height="800" fill="url(#fondoAtardecer)" />
      <Circle cx="340" cy="60" r="220" fill="url(#brilloDorado)" />
      <Circle cx="20" cy="720" r="240" fill="url(#brilloRosa)" />
      <Circle cx="360" cy="700" r="140" fill="url(#brilloDorado)" />
    </Svg>
  );
}
