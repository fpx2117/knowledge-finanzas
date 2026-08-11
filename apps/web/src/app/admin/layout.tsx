import { notFound } from "next/navigation";
import Link from "next/link";

import { isApplicationError } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";

// Every admin route sits behind this single server-side gate — Security Requirement: "no
// reliance on UI hiding." An unauthenticated visitor or an authenticated user with no
// admin_roles row gets the same generic 404, never a "you're not allowed" page that would
// confirm /admin exists as a distinguishable surface.
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let admin;
  try {
    admin = await requireAdminUser();
  } catch (error) {
    if (isApplicationError(error) && (error.code === "UNAUTHENTICATED" || error.code === "FORBIDDEN")) notFound();
    throw error;
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Panel administrativo</p>
          <h1>Know Finanzas — Admin</h1>
        </div>
        <p className="card-helper">{admin.email} · {ROLE_LABEL[admin.role]}</p>
      </header>
      <nav className="admin-nav" aria-label="Navegación admin">
        <Link href="/admin">Resumen</Link>
        <Link href="/admin/users">Usuarios</Link>
        <Link href="/admin/billing">Billing</Link>
        <Link href="/admin/billing/reconciliation">Reconciliación</Link>
        <Link href="/admin/promotions">Promociones</Link>
        <Link href="/admin/referrals">Referidos</Link>
        <Link href="/admin/analytics">Analítica y datos</Link>
        <Link href="/admin/audit">Auditoría</Link>
      </nav>
      <main className="admin-main">{children}</main>
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = { SUPPORT: "Soporte", ADMIN: "Admin", SUPER_ADMIN: "Super admin" };
