export default function Topbar({ onAbrirMenu }) {
  return (
    <header className="topbar">
      <button type="button" className="topbar__menu" onClick={onAbrirMenu} aria-label="Abrir menu">
        <span aria-hidden="true">☰</span>
      </button>
      <div className="topbar__marca">
        <span className="marca__logo marca__logo--sm" aria-hidden="true">✓</span>
        <span className="marca__nombre marca__nombre--sm">TaskEdu</span>
      </div>
    </header>
  )
}
