import { notFound } from "next/navigation";

import { isApplicationError } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { AdminNav } from "@/components/admin/admin-nav";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

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
    <PageContainer>
      <a className="skip-link" href="#admin-main-content">
        Saltar al contenido principal
      </a>
      <PageHeader title="Know Finanzas — Admin" description={`${admin.email} · ${ROLE_LABEL[admin.role]}`} />
      <AdminNav />
      <main id="admin-main-content" className="grid gap-6">{children}</main>
    </PageContainer>
  );
}

const ROLE_LABEL: Record<string, string> = { SUPPORT: "Soporte", ADMIN: "Admin", SUPER_ADMIN: "Super admin" };
