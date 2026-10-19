import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  abierto,
  titulo = 'Confirmar accion',
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'peligro',
  cargando = false,
  onConfirmar,
  onCancelar,
}) {
  return (
    <Modal
      abierto={abierto}
      titulo={titulo}
      onCerrar={onCancelar}
      pie={
        <>
          <Button variante="fantasma" onClick={onCancelar} disabled={cargando}>
            {textoCancelar}
          </Button>
          <Button variante={variante} onClick={onConfirmar} cargando={cargando}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <p className="confirmar__texto">{mensaje}</p>
    </Modal>
  )
}
