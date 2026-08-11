import Link from "next/link";
import { NotificationBell } from "@/features/notifications/components/notification-bell";

const navigation = [
  { label: "Dashboard", href: "/dashboard", index: "01" },
  { label: "Movimientos", href: "/transactions", index: "02" },
  { label: "Cuentas", href: "/accounts", index: "03" },
  { label: "Planificación", href: "/planning", index: "04" },
  { label: "Presupuestos", href: "/budgets", index: "05" },
];

export function AppShell({ children, active = "", initialUnreadCount = 0 }: { children: React.ReactNode; active?: string; initialUnreadCount?: number }) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand-mark" href="/" aria-label="Ir al dashboard">KF</Link>
        <div>
          <p className="eyebrow">Know Finanzas</p>
          <p className="brand-subtitle">Control financiero personal</p>
        </div>
        <nav aria-label="Navegación principal">
          {navigation.map((item) => (
            <Link className={active === item.label ? "nav-link active" : "nav-link"} href={item.href} key={item.label}>
              <span className="nav-index">{item.index}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <NotificationBell initialUnreadCount={initialUnreadCount} />
        <Link className="settings-link" href="/settings/categories">Configuración · Categorías</Link>
        <Link className="settings-link" href="/settings/billing">Configuración · Suscripción</Link>
        <Link className="settings-link" href="/settings/notifications">Configuración · Notificaciones</Link>
        <Link className="settings-link" href="/settings/referrals">Configuración · Referidos</Link>
        <Link className="settings-link" href="/settings/privacy">Configuración · Privacidad y datos</Link>
        <Link className="settings-link" href="/onboarding">Completar perfil</Link>
        <p className="sidebar-note">Una vista clara de lo que tenés y hacia dónde vas.</p>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}
