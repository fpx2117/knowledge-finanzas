import type { ReactNode } from "react";

export type AdminDataTableColumn<T> = { key: string; header: string; render: (row: T) => ReactNode };

// Dense, functional, table-first (docs/21-commercial-admin.md UI style guidance) — every admin
// list surface in this task renders through this one component rather than a bespoke table.
export function AdminDataTable<T extends { id: string }>({ columns, rows, emptyMessage }: { columns: AdminDataTableColumn<T>[]; rows: T[]; emptyMessage: string }) {
  return (
    <table className="admin-table">
      <thead>
        <tr>{columns.map((column) => <th key={column.key}>{column.header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={columns.length}>{emptyMessage}</td></tr>}
        {rows.map((row) => (
          <tr key={row.id}>{columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
