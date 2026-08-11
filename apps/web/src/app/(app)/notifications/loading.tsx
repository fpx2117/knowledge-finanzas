export default function NotificationsLoading() {
  return (
    <div className="loading-stack" aria-busy="true" aria-label="Cargando notificaciones">
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}
