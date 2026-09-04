"use client";
import { Button } from "@/components/ui/button";
export default function PlanningError({ reset }: { reset: () => void }) { return <section className="mt-10 max-w-[620px] rounded-lg border border-border bg-card p-8" role="alert"><h1>No pudimos cargar la planificación.</h1><Button variant="outline" type="button" onClick={reset}>Reintentar</Button></section>; }
