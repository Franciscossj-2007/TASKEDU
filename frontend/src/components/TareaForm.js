import { useState } from 'react';
import { Text, View } from 'react-native';
import { mensajeError, tareasApi } from '../api';
import {
  Button,
  ErrorMsg,
  Field,
  ModalUI,
  OPCIONES_ESTADO,
  OPCIONES_PRIORIDAD,
  SelectCampo,
  Vacio,
  isoATexto,
  textoAIso,
} from '../ui';

// Formulario modal para crear o editar una tarea, con los mismos campos,
// validaciones y textos del TareaFormulario del frontend web.
export default function TareaForm({ tarea, cursos, cursoIdInicial, onClose, onSaved }) {
  const [f, setF] = useState({
    curso_id: tarea?.curso_id ?? cursoIdInicial ?? cursos[0]?.id ?? '',
    titulo: tarea?.titulo ?? '',
    descripcion: tarea?.descripcion ?? '',
    fecha: tarea ? isoATexto(tarea.fecha_entrega) : isoATexto(new Date(Date.now() + 86400000).toISOString()),
    prioridad: tarea?.prioridad ?? 'media',
    estado: tarea?.estado ?? 'pendiente',
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const set = (campo) => (valor) => setF((actual) => ({ ...actual, [campo]: valor }));

  function validar() {
    const nuevos = {};
    if (!f.titulo.trim()) nuevos.titulo = 'El titulo es obligatorio';
    if (!f.curso_id) nuevos.curso_id = 'Selecciona un curso';
    if (!f.fecha) nuevos.fecha = 'La fecha de entrega es obligatoria';
    else if (!textoAIso(f.fecha)) nuevos.fecha = 'Formato: AAAA-MM-DD HH:MM';
    if (!f.prioridad) nuevos.prioridad = 'Selecciona una prioridad';
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function guardar() {
    setErrorGeneral('');
    if (!validar()) return;
    const body = {
      curso_id: Number(f.curso_id),
      titulo: f.titulo.trim(),
      descripcion: f.descripcion.trim() || null,
      fecha_entrega: textoAIso(f.fecha),
      prioridad: f.prioridad,
      estado: f.estado,
    };
    setEnviando(true);
    try {
      if (tarea) await tareasApi.actualizar(tarea.id, body);
      else await tareasApi.crear(body);
      onSaved();
    } catch (e) {
      setErrorGeneral(mensajeError(e));
      setEnviando(false);
    }
  }

  const opcionesCursos = cursos.map((c) => ({ valor: c.id, etiqueta: c.nombre }));

  return (
    <ModalUI
      visible
      titulo={tarea ? 'Editar tarea' : 'Nueva tarea'}
      onCerrar={onClose}
      pie={
        <>
          <Button kind="fantasma" title="Cancelar" onPress={onClose} disabled={enviando} />
          <Button title={tarea ? 'Guardar cambios' : 'Crear tarea'} cargando={enviando} onPress={guardar} />
        </>
      }
    >
      <ErrorMsg>{errorGeneral}</ErrorMsg>

      {cursos.length === 0 ? (
        <Vacio icono="▦" titulo="Primero crea un curso" mensaje="Necesitas al menos un curso para registrar tareas." />
      ) : (
        <>
          <Field
            label="Titulo"
            requerido
            value={f.titulo}
            onChangeText={set('titulo')}
            error={errores.titulo}
            maxLength={150}
            placeholder="Ej. Investigar sobre normalizacion de bases de datos"
          />
          <Field
            label="Descripcion"
            value={f.descripcion}
            onChangeText={set('descripcion')}
            error={errores.descripcion}
            multiline
            maxLength={2000}
            placeholder="Detalles opcionales de la tarea"
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <SelectCampo
                label="Curso"
                requerido
                value={f.curso_id}
                opciones={opcionesCursos}
                onChange={set('curso_id')}
                error={errores.curso_id}
                placeholder="Selecciona un curso"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Fecha y hora de entrega"
                requerido
                value={f.fecha}
                onChangeText={set('fecha')}
                error={errores.fecha}
                autoCapitalize="none"
                placeholder="AAAA-MM-DD HH:MM"
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <SelectCampo
                label="Prioridad"
                requerido
                value={f.prioridad}
                opciones={OPCIONES_PRIORIDAD}
                onChange={set('prioridad')}
                error={errores.prioridad}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SelectCampo
                label="Estado"
                value={f.estado}
                opciones={OPCIONES_ESTADO}
                onChange={set('estado')}
                error={errores.estado}
              />
            </View>
          </View>
        </>
      )}
    </ModalUI>
  );
}
