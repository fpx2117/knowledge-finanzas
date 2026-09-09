"use client";

import { useEffect, useRef, useState } from "react";
import { SparklesIcon, XIcon, SendHorizontalIcon, Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getAssistantAccessAction, sendAssistantMessageAction } from "../actions/assistant-actions";
import { MAX_ASSISTANT_MESSAGE_LENGTH } from "../lib/constants";
import type { AssistantAccess } from "@/lib/ai/assistant-usage.instance";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "¿Cuánto tengo disponible este mes?",
  "¿Qué obligaciones tengo próximas?",
  "¿Cómo viene mi resultado del mes?",
];

export function FloatingAssistant({ initialAccess }: { initialAccess: AssistantAccess }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [access, setAccess] = useState<AssistantAccess>(initialAccess);
  const [banner, setBanner] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      inputRef.current?.focus();
    }
  }, [open, messages, pending]);

  // Refresh the credit meter when the panel opens (it may have changed elsewhere).
  useEffect(() => {
    if (!open) return;
    getAssistantAccessAction().then(setAccess).catch(() => {});
  }, [open]);

  const outOfCredits = access.enabled && access.credits.available < 2;
  const canSend = access.enabled && !outOfCredits && !pending && draft.trim().length > 0;

  async function send(text: string) {
    const message = text.trim();
    if (!message || pending || !access.enabled || outOfCredits) return;

    const history = messages.slice(-10);
    setMessages((current) => [...current, { role: "user", content: message }]);
    setDraft("");
    setBanner(null);
    setPending(true);

    const result = await sendAssistantMessageAction({ message, history });
    setPending(false);

    if (result.access) setAccess(result.access);
    if (result.ok) {
      setMessages((current) => [...current, { role: "assistant", content: result.reply }]);
    } else {
      setBanner(result.error.message);
    }
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir el asistente"
          className="fixed bottom-4 right-4 z-[var(--z-popover)] flex size-12 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:bottom-6 sm:right-6"
        >
          <SparklesIcon className="size-5" />
        </button>
      ) : null}

      <div
        role="dialog"
        aria-label="Asistente financiero"
        inert={!open}
        className={cn(
          "fixed z-[var(--z-popover)] flex flex-col overflow-hidden border border-border bg-card shadow-xl transition-all duration-200",
          "inset-x-0 bottom-0 h-[78dvh] rounded-t-2xl",
          "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[560px] sm:max-h-[calc(100dvh-6rem)] sm:w-[380px] sm:rounded-2xl",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-brand" />
            <span className="text-small font-semibold text-foreground">Asistente</span>
            {access.enabled ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-caption tabular-nums text-muted-foreground">
                {access.credits.available} créd.
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </header>

        <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col gap-3">
              <p className="text-small text-muted-foreground">
                Preguntame sobre tus finanzas. Uso solo tus datos registrados y cada respuesta descuenta créditos de IA.
              </p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!access.enabled || outOfCredits}
                    onClick={() => send(s)}
                    className="rounded-lg border border-border px-3 py-2 text-left text-small text-foreground-secondary transition-colors hover:bg-secondary disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-small",
                  m.role === "user"
                    ? "self-end bg-brand-subtle text-foreground"
                    : "self-start bg-secondary text-foreground-secondary",
                )}
              >
                {m.content}
              </div>
            ))
          )}
          {pending ? (
            <div className="flex items-center gap-2 self-start text-caption text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" /> Pensando…
            </div>
          ) : null}
        </div>

        {banner ? (
          <p role="alert" className="border-t border-border bg-warning-soft px-4 py-2 text-caption text-[var(--warning)]">
            {banner}
          </p>
        ) : null}

        <form
          className="flex items-end gap-2 border-t border-border px-3 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <div className="flex flex-1 flex-col">
            <textarea
              ref={inputRef}
              value={draft}
              maxLength={MAX_ASSISTANT_MESSAGE_LENGTH}
              rows={1}
              disabled={!access.enabled}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              placeholder={
                !access.enabled
                  ? access.reason === "DISABLED"
                    ? "La IA no está disponible."
                    : "Reactivá tu suscripción para usar la IA."
                  : outOfCredits
                    ? "Sin créditos de IA disponibles."
                    : "Escribí tu pregunta…"
              }
              className="max-h-28 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-small outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
            />
            <span className="mt-0.5 self-end text-[0.65rem] tabular-nums text-muted-foreground">
              {draft.length}/{MAX_ASSISTANT_MESSAGE_LENGTH}
            </span>
          </div>
          <Button type="submit" size="icon" aria-label="Enviar" disabled={!canSend} className="mb-5 shrink-0">
            <SendHorizontalIcon className="size-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
