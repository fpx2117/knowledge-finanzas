"use client";

import { useState } from "react";
import { generateInstallments, Money, validateInstallmentPreview } from "@know-finanzas/finance";
import { createDebtAction } from "../actions/create-debt";

type Row = { installmentNumber: number; dueDate: string; amount: string };

export function DebtPreviewForm() {
  const [name, setName] = useState("Nueva deuda");
  const [total, setTotal] = useState("100");
  const [count, setCount] = useState("3");
  const [firstDate, setFirstDate] = useState("2026-01-31");
  const [frequency, setFrequency] = useState<"MONTHLY" | "WEEKLY" | "BIWEEKLY">("MONTHLY");
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState("");

  function generate() {
    try {
      const result = generateInstallments({ totalPayable: Money.fromPositiveString(total, "ARS"), installmentCount: Number(count), firstDueDate: firstDate, frequency });
      setRows(result.installments.map((item) => ({ installmentNumber: item.installmentNumber, dueDate: item.dueDate, amount: item.totalAmount.toString() })));
      setMessage("Preview generado. Revisá las fechas e importes antes de confirmar.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo generar el preview."); }
  }

  function validate() {
    try {
      validateInstallmentPreview({ totalPayable: Money.fromPositiveString(total, "ARS"), installments: rows.map((row) => ({ installmentNumber: row.installmentNumber, dueDate: row.dueDate, totalAmount: Money.fromString(row.amount, "ARS") })) });
      setMessage("Preview válido y listo para confirmación.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "El preview no es válido."); }
  }

  return <div className="debt-preview-layout">
    <form className="transaction-form" onSubmit={(event) => { event.preventDefault(); generate(); }}>
      <div className="field-group"><label htmlFor="debt-name">Nombre</label><input id="debt-name" value={name} onChange={(event) => setName(event.target.value)} /></div>
      <div className="field-group"><label htmlFor="debt-total">Total a pagar</label><input id="debt-total" value={total} onChange={(event) => setTotal(event.target.value)} inputMode="decimal" /></div>
      <div className="field-group"><label htmlFor="debt-count">Cantidad de cuotas</label><input id="debt-count" type="number" min="1" value={count} onChange={(event) => setCount(event.target.value)} /></div>
      <div className="field-group"><label htmlFor="debt-first-date">Primer vencimiento</label><input id="debt-first-date" type="date" value={firstDate} onChange={(event) => setFirstDate(event.target.value)} /></div>
      <div className="field-group"><label htmlFor="debt-frequency">Frecuencia</label><select id="debt-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as typeof frequency)}><option value="MONTHLY">Mensual</option><option value="WEEKLY">Semanal</option><option value="BIWEEKLY">Quincenal</option></select></div>
      <button className="primary-button" type="submit">Generar preview</button>
    </form>
    {rows.length > 0 && <section className="preview-card" aria-label="Preview de cuotas"><p className="card-label">Revisá tus cuotas</p>{rows.map((row, index) => <div className="preview-row" key={row.installmentNumber}><span>Cuota {row.installmentNumber}</span><input aria-label={`Fecha cuota ${row.installmentNumber}`} type="date" value={row.dueDate} onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, dueDate: event.target.value } : item))} /><input aria-label={`Importe cuota ${row.installmentNumber}`} value={row.amount} onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, amount: event.target.value } : item))} /><span>ARS</span></div>)}<button className="secondary-button" type="button" onClick={validate}>Validar preview</button>{message && <p className="form-alert" role="status">{message}</p>}<form action={async (data) => { await createDebtAction(data); }}><input type="hidden" name="name" value={name} /><input type="hidden" name="originalAmount" value={total} /><input type="hidden" name="startDate" value={firstDate} /><input type="hidden" name="installments" value={JSON.stringify(rows)} /><button className="primary-button" type="submit">Confirmar deuda</button></form></section>}
    {rows.length === 0 && message && <p className="form-alert" role="alert">{message}</p>}
  </div>;
}
