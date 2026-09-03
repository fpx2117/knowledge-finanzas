export default function NotificationsLoading() {
  return (
    <div className="mt-10 grid gap-5" aria-busy="true" aria-label="Cargando notificaciones">
      <div className="animate-pulse rounded-md bg-muted h-16 max-w-[500px]" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="animate-pulse rounded-md bg-muted h-64" />
        <div className="animate-pulse rounded-md bg-muted h-64" />
      </div>
    </div>
  );
}
