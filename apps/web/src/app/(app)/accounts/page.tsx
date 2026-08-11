import Link from "next/link";

import { accountRepository } from "@know-finanzas/db";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { createAccountService } from "@/features/accounts/services/account-service";
import { AccountCard } from "@/features/accounts/components/account-card";

const service = createAccountService({ accounts: accountRepository });

export default async function AccountsPage() {
  const user = await requireCurrentUser();
  const accounts = await service.listAccounts(user.id);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Tu patrimonio líquido</p>
          <h1>Cuentas</h1>
          <p className="lede">Cada cuenta conserva su historia y muestra un saldo que se puede explicar.</p>
        </div>
        <Link className="primary-button" href="/accounts/new">Crear cuenta</Link>
      </header>

      {accounts.length === 0 ? (
        <section className="accounts-empty" role="status">
          <span className="empty-symbol" aria-hidden="true">+</span>
          <h2>Todavía no tenés cuentas.</h2>
          <p>Creá tu primera cuenta para empezar a entender tu posición real.</p>
          <Link className="secondary-button" href="/accounts/new">Crear primera cuenta</Link>
        </section>
      ) : (
        <section className="accounts-grid" aria-label="Tus cuentas">
          {accounts.map((account) => <AccountCard account={account} key={account.id} />)}
        </section>
      )}
    </>
  );
}
