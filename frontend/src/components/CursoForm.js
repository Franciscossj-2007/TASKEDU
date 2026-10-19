import { useState } from 'react';
import { cursosApi, mensajeError } from '../api';
import { Button, ErrorMsg, Field, ModalUI } from '../ui';

// Formulario modal para crear o editar un curso, con los mismos campos,
// validaciones y textos del CursoFormulario del frontend web.
export default function CursoForm({ curso, onClose, onSaved }) {
  const [f, setF] = useState({
    nombre: curso?.nombre ?? '',
    docente: curso?.docente ?? '',
    descripcion: curso?.descripcion ?? '',
  });
  const [error, setError] = useState('');
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const set = (campo) => (valor) => setF((actual) => ({ ...actual, [campo]: valor }));

  async function guardar() {
    setError('');
    if (!f.nombre.trim()) {
      setErrores({ nombre: 'El nombre es obligatorio' });
      return;
    }
    setErrores({});
    const body = {
      nombre: f.nombre.trim(),
      docente: f.docente.trim() || null,
      descripcion: f.descripcion.trim() || null,
    };
    setEnviando(true);
    try {
      if (curso) await cursosApi.actualizar(curso.id, body);
      else await cursosApi.crear(body);
      onSaved();
    } catch (e) {
      setError(mensajeError(e));
      setEnviando(false);
    }
  }

  return (
    <ModalUI
      visible
      titulo={curso ? 'Editar curso' : 'Nuevo curso'}
      onCerrar={onClose}
      pie={
        <>
          <Button kind="fantasma" title="Cancelar" onPress={onClose} disabled={enviando} />
          <Button title={curso ? 'Guardar cambios' : 'Crear curso'} cargando={enviando} onPress={guardar} />
        </>
      }
    >
      <ErrorMsg>{error}</ErrorMsg>
      <Field
        label="Nombre del curso"
        requerido
        value={f.nombre}
        onChangeText={set('nombre')}
        error={errores.nombre}
        maxLength={100}
        placeholder="Ej. Programacion Web"
      />
      <Field
        label="Docente"
        value={f.docente}
        onChangeText={set('docente')}
        maxLength={100}
        placeholder="Nombre del docente (opcional)"
      />
      <Field
        label="Descripcion"
        value={f.descripcion}
        onChangeText={set('descripcion')}
        multiline
        maxLength={2000}
        placeholder="Descripcion del curso (opcional)"
      />
    </ModalUI>
  );
}
