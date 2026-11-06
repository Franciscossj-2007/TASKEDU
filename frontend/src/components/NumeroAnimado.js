import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

// Numero que "cuenta" desde su valor anterior hasta el nuevo (ej. 0 -> 17) con desaceleracion.
export default function NumeroAnimado({ valor = 0, duracion = 900, sufijo = '', style }) {
  const [mostrado, setMostrado] = useState(0);
  const anterior = useRef(0);

  useEffect(() => {
    const desde = anterior.current;
    const hasta = Number(valor) || 0;
    const inicio = Date.now();
    let frame;
    const paso = () => {
      const t = Math.min(1, (Date.now() - inicio) / duracion);
      const suave = 1 - Math.pow(1 - t, 3);
      setMostrado(Math.round(desde + (hasta - desde) * suave));
      if (t < 1) frame = requestAnimationFrame(paso);
      else anterior.current = hasta;
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [valor, duracion]);

  return (
    <Text style={[{ fontVariant: ['tabular-nums'] }, style]}>
      {mostrado}
      {sufijo}
    </Text>
  );
}
