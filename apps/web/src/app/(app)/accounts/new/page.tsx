import Link from "next/link";
import { AccountForm } from "@/features/accounts/components/account-form";

export default function NewAccountPage() {
  return <><Link className="back-link" href="/accounts">← Volver a cuentas</Link><div className="form-page-header"><p className="eyebrow">Nueva cuenta</p><h1>Empezá por lo que tenés.</h1><p className="lede">El saldo inicial es un punto de partida, no un ingreso.</p></div><AccountForm /></>;
}
