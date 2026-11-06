import { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ATARDECER } from './Degradado';

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

// Anillo de progreso con degradado que se llena animado al montarse o al cambiar "valor" (0 a 1).
export default function AnilloProgreso({ valor = 0, tamano = 64, grosor = 7, pista = 'rgba(255,255,255,0.15)', children }) {
  const id = `anillo${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const reducido = useReducedMotion();
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const progreso = useSharedValue(0);

  useEffect(() => {
    const destino = Math.max(0, Math.min(1, valor || 0));
    progreso.value = reducido ? destino : withTiming(destino, { duration: 1100, easing: Easing.out(Easing.cubic) });
  }, [valor, reducido]);

  const propsAnimadas = useAnimatedProps(() => ({
    strokeDashoffset: circunferencia * (1 - progreso.value),
  }));

  return (
    <View style={{ width: tamano, height: tamano, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tamano} height={tamano} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {ATARDECER.map((c, i) => (
              <Stop key={c} offset={i / (ATARDECER.length - 1)} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        <Circle cx={tamano / 2} cy={tamano / 2} r={radio} stroke={pista} strokeWidth={grosor} fill="none" />
        <CirculoAnimado
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          stroke={`url(#${id})`}
          strokeWidth={grosor}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circunferencia} ${circunferencia}`}
          animatedProps={propsAnimadas}
        />
      </Svg>
      {children}
    </View>
  );
}
