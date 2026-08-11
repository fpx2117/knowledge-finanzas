"use client";

export default function AccountDetailError({ reset }: { reset: () => void }) { return <section className="error-panel" role="alert"><h1>No pudimos cargar esta cuenta.</h1><p>Intentá nuevamente.</p><button className="secondary-button" type="button" onClick={reset}>Reintentar</button></section>; }
