import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Juego de iconos de trazo (24x24, trazo 2, extremos redondeados) para toda la app.
// Reemplaza los caracteres unicode y emojis que se usaban como iconos.
const ICONOS = {
  panel: (
    <>
      <Rect x="3" y="3" width="7" height="9" rx="1.5" />
      <Rect x="14" y="3" width="7" height="5" rx="1.5" />
      <Rect x="14" y="12" width="7" height="9" rx="1.5" />
      <Rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  tareas: (
    <>
      <Path d="M9 11l3 3 8-8" />
      <Path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" />
    </>
  ),
  cursos: (
    <>
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  salir: (
    <>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Path d="M16 17l5-5-5-5" />
      <Path d="M21 12H9" />
    </>
  ),
  mas: <Path d="M12 5v14M5 12h14" />,
  calendario: (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  reloj: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  alerta: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 8v4M12 16h.01" />
    </>
  ),
  circulo: <Circle cx="12" cy="12" r="9" />,
  progreso: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 3a9 9 0 0 1 0 18" />
    </>
  ),
  check: <Path d="M20 6L9 17l-5-5" />,
  checkCirculo: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M8 12l3 3 5-6" />
    </>
  ),
  capas: (
    <>
      <Path d="M12 2L2 7l10 5 10-5-10-5z" />
      <Path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </>
  ),
  buscar: (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M21 21l-4.35-4.35" />
    </>
  ),
  filtro: <Path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
  editar: <Path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  borrar: (
    <>
      <Path d="M3 6h18" />
      <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <Path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </>
  ),
  abajo: <Path d="M6 9l6 6 6-6" />,
  atras: <Path d="M15 18l-6-6 6-6" />,
  derecha: <Path d="M9 18l6-6-6-6" />,
  cerrar: <Path d="M18 6L6 18M6 6l12 12" />,
  usuario: (
    <>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </>
  ),
  rayo: <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  ojo: (
    <>
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  ojoCerrado: (
    <>
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <Path d="M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" />
    </>
  ),
  bandeja: (
    <>
      <Path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <Path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  campana: (
    <>
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  correo: (
    <>
      <Rect x="2" y="4" width="20" height="16" rx="2" />
      <Path d="M22 7l-10 6L2 7" />
    </>
  ),
  candado: (
    <>
      <Rect x="4" y="11" width="16" height="10" rx="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v2" />
    </>
  ),
  birrete: (
    <>
      <Path d="M22 10L12 5 2 10l10 5 10-5z" />
      <Path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 10v6" />
    </>
  ),
  documento: (
    <>
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6M8 13h8M8 17h5" />
    </>
  ),
  libroAbierto: (
    <>
      <Path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <Path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </>
  ),
  play: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M10 8.5l5 3.5-5 3.5z" />
    </>
  ),
  flecha: <Path d="M5 12h14M13 6l6 6-6 6" />,
  fiesta: (
    <>
      <Path d="M5.8 11.3L2 22l10.7-3.79" />
      <Path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01" />
      <Path d="M22 2l-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
      <Path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2z" />
    </>
  ),
};

// relleno: rellena las formas con el mismo color (para la pestaña activa).
export default function Icon({ nombre, tamano = 20, color = '#1a2b4c', grosor = 2, relleno }) {
  return (
    <Svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill={relleno ? color : 'none'}
      stroke={color}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONOS[nombre] ?? ICONOS.circulo}
    </Svg>
  );
}
