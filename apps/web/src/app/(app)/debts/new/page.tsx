import Link from "next/link";
import { DebtPreviewForm } from "@/features/debts/components/debt-preview-form";
export default function NewDebtPage() { return <><Link className="back-link" href="/dashboard">← Volver al resumen</Link><div className="form-page-header"><p className="eyebrow">Nueva deuda</p><h1>Revisá tus cuotas antes de confirmar.</h1><p className="lede">Este preview no persiste nada. Podés ajustar fechas e importes y validar que el total siga siendo exacto.</p></div><DebtPreviewForm /></>; }
