export default function EstadisticaCard({ titulo, valor, color = 'primario', icono }) {
  return (
    <div className={`estadistica estadistica--${color}`}>
      <div className="estadistica__cabecera">
        {icono && <span className="estadistica__icono" aria-hidden="true">{icono}</span>}
        <span className="estadistica__titulo">{titulo}</span>
      </div>
      <span className="estadistica__valor">{valor}</span>
    </div>
  )
}
