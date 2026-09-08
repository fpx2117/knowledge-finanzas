"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";

// spec 12 §20 — Feedback es idea/opinión/mejora (≠ soporte). Sin backend de feedback todavía:
// el envío arma un correo con el tipo y, si el usuario lo pide, la pantalla desde la que escribe.
const TYPES = [
  "Sugerir una mejora",
  "Reportar algo confuso",
  "Reportar un error visual",
  "Contar algo que falta",
  "Dar feedback general",
] as const;

export function FeedbackForm() {
  const pathname = usePathname();
  const [type, setType] = useState<(typeof TYPES)[number]>(TYPES[0]);
  const [text, setText] = useState("");
  const [includeScreen, setIncludeScreen] = useState(true);

  const body = [text.trim(), includeScreen ? `\n\n—\nPantalla: ${pathname}` : ""].join("");
  const mailto = `mailto:feedback@knowfinanzas.com?subject=${encodeURIComponent(`[Feedback] ${type}`)}&body=${encodeURIComponent(body)}`;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        if (!text.trim()) event.preventDefault();
      }}
      action={mailto}
    >
      <Field label="Tipo" htmlFor="feedback-type">
        <select
          id="feedback-type"
          value={type}
          onChange={(event) => setType(event.target.value as (typeof TYPES)[number])}
          className={fieldControlClass}
        >
          {TYPES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field label="¿Qué te gustaría mejorar?" htmlFor="feedback-text">
        <textarea
          id="feedback-text"
          required
          rows={4}
          maxLength={2000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className={fieldControlClass}
          placeholder="Contanos tu idea con tus palabras."
        />
      </Field>

      <label className="flex items-center gap-2 text-small text-foreground-secondary">
        <input
          type="checkbox"
          checked={includeScreen}
          onChange={(event) => setIncludeScreen(event.target.checked)}
          className="size-4 rounded border-border"
        />
        Incluir la pantalla desde la que escribo
      </label>

      <Button type="submit" disabled={!text.trim()} className="self-start">
        Enviar
      </Button>
      <p className="text-caption text-muted-foreground">
        Se abre tu correo con el mensaje listo. Si tenés un problema que necesita resolución, usá{" "}
        <a href="/help/contact" className="font-medium text-brand hover:underline">
          Contactar soporte
        </a>
        .
      </p>
    </form>
  );
}
