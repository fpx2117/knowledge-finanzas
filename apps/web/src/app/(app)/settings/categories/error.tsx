"use client";

export default function CategoriesError({ reset }: { reset: () => void }) { return <section className="error-panel" role="alert"><h1>No pudimos cargar tus categorías.</h1><p>Tus movimientos no fueron modificados.</p><button className="secondary-button" type="button" onClick={reset}>Reintentar</button></section>; }
