import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

// Degradado "Atardecer" de la marca: rosa -> coral -> naranja.
export const ATARDECER = ['#ff5470', '#ff6b4a', '#ffb020'];

// Fondo degradado que ocupa todo su contenedor. Se coloca como primer hijo
// de una vista con overflow: 'hidden' (o se le pasa el mismo radio).
export default function Degradado({ colores = ATARDECER, radio = 0, horizontal = false, style }) {
  const id = `deg${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const paso = colores.length > 1 ? 1 / (colores.length - 1) : 1;
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2={horizontal ? '0' : '1'}>
            {colores.map((c, i) => (
              <Stop key={i} offset={i * paso} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={radio} ry={radio} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
