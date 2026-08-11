"use client";
export default function TransactionDetailError({ reset }: { reset: () => void }) { return <section className="error-panel" role="alert"><h1>No pudimos cargar este movimiento.</h1><button className="secondary-button" type="button" onClick={reset}>Reintentar</button></section>; }
