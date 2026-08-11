"use client";
export default function PlanningError({ reset }: { reset: () => void }) { return <section className="error-panel" role="alert"><h1>No pudimos cargar la planificación.</h1><button className="secondary-button" type="button" onClick={reset}>Reintentar</button></section>; }
