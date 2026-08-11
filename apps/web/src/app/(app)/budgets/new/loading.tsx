export default function NewBudgetLoading() {
  return (
    <div className="loading-stack" aria-busy="true" aria-label="Cargando formulario">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-form" />
    </div>
  );
}
