import Link from "next/link";

import { MoneyAmount } from "@/components/financial/money-amount";

type AccountCardProps = {
  account: {
    id: string;
    name: string;
    type: string;
    currencyCode: string;
    balance: string;
    status: string;
  };
};

const typeLabels: Record<string, string> = {
  CASH: "Efectivo",
  BANK: "Banco",
  DIGITAL_WALLET: "Billetera digital",
  SAVINGS: "Ahorro",
};

export function AccountCard({ account }: AccountCardProps) {
  return (
    <article className="account-card">
      <div className="account-card-topline">
        <span className="account-type-mark" aria-hidden="true">{account.type === "BANK" ? "BK" : "$"}</span>
        <span className="status-badge">{account.status === "ACTIVE" ? "Activa" : "Archivada"}</span>
      </div>
      <p className="account-type">{typeLabels[account.type] ?? account.type} · {account.currencyCode}</p>
      <h2>{account.name}</h2>
      <p className="account-balance"><MoneyAmount amount={account.balance} currency={account.currencyCode} /></p>
      <Link className="account-link" href={`/accounts/${account.id}`}>Ver cuenta <span aria-hidden="true">→</span></Link>
    </article>
  );
}
