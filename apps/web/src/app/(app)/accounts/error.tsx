"use client";

export default function AccountsError({ reset }: { reset: () => void }) {
  return <section className="error-panel" role="alert"><h1>No pudimos cargar tus cuentas.</h1><p>Intentá nuevamente.</p><button className="secondary-button" type="button" onClick={reset}>Reintentar</button></section>;
}
