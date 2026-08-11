import Link from "next/link";

import { isApplicationError } from "@know-finanzas/shared";
import { requireAdminUser } from "@/lib/auth/require-admin-user";
import { searchAdminUsers } from "@/lib/admin/search-admin-users.instance";

export default async function AdminUsersSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdminUser("commercial.users.read");
  const q = (await searchParams).q?.trim() ?? "";

  let results: Awaited<ReturnType<typeof searchAdminUsers>> = [];
  let error: string | null = null;
  if (q) {
    try {
      results = await searchAdminUsers(q);
    } catch (caught) {
      error = isApplicationError(caught) ? caught.message : "No pudimos completar la búsqueda.";
    }
  }

  return (
    <section>
      <p className="card-label">Usuarios</p>
      <h2>Buscar usuario</h2>
      <form className="admin-search-form" style={{ marginTop: 16 }}>
        <div className="field-group">
          <label htmlFor="admin-user-query">Email (exacto/prefijo) o ID interno</label>
          <input id="admin-user-query" name="q" type="text" defaultValue={q} placeholder="usuario@ejemplo.com" minLength={3} />
        </div>
        <button className="secondary-button" type="submit">Buscar</button>
      </form>

      {error && (
        <div className="form-alert" role="alert" style={{ marginTop: 20 }}>
          <strong>{error}</strong>
        </div>
      )}

      {q && !error && (
        <table className="admin-table" style={{ marginTop: 24 }}>
          <thead>
            <tr><th>Nombre</th><th>Email</th><th>Creado</th><th /></tr>
          </thead>
          <tbody>
            {results.length === 0 && (
              <tr><td colSpan={4}>Sin resultados para &ldquo;{q}&rdquo;.</td></tr>
            )}
            {results.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td><Link href={`/admin/users/${user.id}`}>Ver resumen</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(value);
}
