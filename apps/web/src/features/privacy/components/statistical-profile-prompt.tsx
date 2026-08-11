import Link from "next/link";
import { dismissStatisticalProfilePromptAction } from "../actions/dismiss-prompt";

// Shown after the user has already gotten real value from the product (Scope: "after the user
// has already received value... not at signup") — the dashboard page only renders this once the
// caller has already checked the engagement threshold and that it hasn't been dismissed before.
// Skippable with equal visual weight to the "fill it in" link (Security Requirement: no dark patterns).
export function StatisticalProfilePrompt() {
  return (
    <section className="detail-card" role="status">
      <p className="card-label">¿Nos contás un poco más sobre vos? (opcional)</p>
      <p className="card-helper">
        Ayuda a mejorar el producto de forma totalmente anónima y agregada. Es opcional, no afecta tu cuenta, y podés
        completarlo o ignorarlo.
      </p>
      <div className="header-actions">
        <Link className="secondary-button" href="/settings/privacy">Completar perfil</Link>
        <form action={dismissStatisticalProfilePromptAction}>
          <button className="text-button" type="submit">Ahora no</button>
        </form>
      </div>
    </section>
  );
}
