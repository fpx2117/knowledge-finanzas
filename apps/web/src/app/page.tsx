import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
  /* return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">KF</div>
        <div>
          <p className="eyebrow">Know Finanzas</p>
          <p className="brand-subtitle">Control financiero personal</p>
        </div>
        <nav aria-label="Navegación principal">
          {navigation.map((item, index) => (
            <Link className={index === 0 ? "nav-link active" : "nav-link"} href={item.href} key={item.label}>
              <span className="nav-index">0{index + 1}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="sidebar-note">Una vista clara de lo que tenés y hacia dónde vas.</p>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Resumen financiero</p>
            <h1>Tu dinero, sin ruido.</h1>
            <p className="lede">Empezá por registrar tu primera cuenta para ver tu posición real.</p>
          </div>
          <Link className="primary-button" href="/accounts/new">Crear cuenta</Link>
        </header>

        <section className="hero-card" aria-labelledby="balance-title">
          <div>
            <p className="card-label" id="balance-title">Dinero en cuentas</p>
            <p className="balance-placeholder">$ 0,00</p>
            <p className="card-helper">Tu saldo aparecerá cuando agregues una cuenta.</p>
          </div>
          <div className="hero-orbit" aria-hidden="true"><span /></div>
        </section>

        <div className="metric-grid">
          <article className="metric-card">
            <p className="card-label">Ingresos</p>
            <p className="metric-value">$ 0,00</p>
            <p className="card-helper">Este mes</p>
          </article>
          <article className="metric-card">
            <p className="card-label">Gastos</p>
            <p className="metric-value">$ 0,00</p>
            <p className="card-helper">Este mes</p>
          </article>
        </div>

        <section className="empty-panel" aria-labelledby="recent-title">
          <div>
            <p className="card-label" id="recent-title">Movimientos recientes</p>
            <h2>Todavía no hay movimientos.</h2>
            <p className="card-helper">Cuando registres un ingreso o un gasto, lo vas a encontrar acá.</p>
          </div>
          <span className="empty-line" aria-hidden="true" />
        </section>
      </section>
    </main>
  ); */
}
