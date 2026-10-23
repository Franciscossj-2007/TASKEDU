import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Fondo azul de marca: degradado diagonal con dos formas suaves y,
// opcionalmente, una ola clara en el borde inferior (cabecera de acceso).
export default function FondoAzul({ ola }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="fondoAzul" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0a4fd6" />
          <Stop offset="0.55" stopColor="#0b66f0" />
          <Stop offset="1" stopColor="#3b8bff" />
        </LinearGradient>
      </Defs>
      <Rect width="400" height="400" fill="url(#fondoAzul)" />
      <Circle cx="-30" cy="40" r="170" fill="#ffffff" fillOpacity="0.07" />
      <Circle cx="430" cy="120" r="150" fill="#ffffff" fillOpacity="0.06" />
      {ola ? (
        <Path d="M0 360 C 90 330, 150 395, 250 372 S 360 330, 400 350 L400 400 L0 400 Z" fill="#ffffff" fillOpacity="0.12" />
      ) : null}
    </Svg>
  );
}
