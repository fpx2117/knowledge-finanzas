import Link from "next/link";

import { isApplicationError } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { searchAdminUsers } from "@/lib/admin/search-admin-users.instance";
import { AdminDataTable, type AdminDataTableColumn } from "@/features/admin/shared/admin-data-table";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";

type AdminUserRow = Awaited<ReturnType<typeof searchAdminUsers>>[number];

export default async function AdminUsersSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminUser("commercial.users.read");
  const q = (await searchParams).q?.trim() ?? "";

  let results: AdminUserRow[] = [];
  let error: string | null = null;
  if (q) {
    try {
      results = await searchAdminUsers(q);
    } catch (caught) {
      error = isApplicationError(caught) ? caught.message : "No pudimos completar la búsqueda.";
    }
  }

  const columns: AdminDataTableColumn<AdminUserRow>[] = [
    { key: "name", header: "Nombre", render: (row) => row.name },
    { key: "email", header: "Email", render: (row) => row.email },
    { key: "createdAt", header: "Creado", render: (row) => formatDate(row.createdAt) },
    { key: "actions", header: "", render: (row) => <Link href={`/admin/users/${row.id}`}>Ver resumen</Link> },
  ];

  return (
    <section>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usuarios</p>
      <h2>Buscar usuario</h2>
      <form className="mt-4">
        <FilterBar
          search={<SearchInput name="q" defaultValue={q} placeholder="usuario@ejemplo.com" aria-label="Email (exacto/prefijo) o ID interno" minLength={3} />}
          filters={<Button type="submit" variant="outline">Buscar</Button>}
        />
      </form>

      {error && (
        <div className="mt-5">
          <ErrorState message={error} />
        </div>
      )}

      {q && !error && (
        <div className="mt-6">
          <AdminDataTable caption={`Resultados de búsqueda para "${q}"`} columns={columns} rows={results} emptyMessage={`Sin resultados para "${q}".`} />
        </div>
      )}
    </section>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}
