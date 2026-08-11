export default function BudgetDetailLoading() {
  return (
    <div className="loading-stack" aria-busy="true" aria-label="Cargando presupuesto">
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}
