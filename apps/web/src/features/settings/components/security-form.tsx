"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, fieldControlClass } from "@/components/shared/form-field";
import { authClient } from "@/lib/auth/client";

// spec 11 §10.2 — cambio de contraseña (verifica la actual) + opción de cerrar las demás
// sesiones. Usa el cliente better-auth directamente; el rate limit lo aplica el servidor.
export function SecurityForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDone(false);
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirm = String(data.get("confirmPassword") ?? "");
    const revokeOtherSessions = data.get("revokeOtherSessions") === "on";

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setPending(true);
    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions });
    setPending(false);

    if (result.error) {
      setError(
        result.error.code === "INVALID_PASSWORD"
          ? "La contraseña actual no es correcta."
          : "No pudimos cambiar la contraseña. Probá de nuevo.",
      );
      return;
    }
    form.reset();
    setDone(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {error}
        </p>
      ) : null}
      {done ? (
        <p role="status" className="rounded-md bg-success-soft px-3 py-2 text-small text-[var(--success)]">
          Contraseña actualizada.
        </p>
      ) : null}

      <Field label="Contraseña actual" htmlFor="currentPassword">
        <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className={fieldControlClass} />
      </Field>
      <Field label="Nueva contraseña" htmlFor="newPassword" help="Al menos 8 caracteres.">
        <input id="newPassword" name="newPassword" type="password" required minLength={8} autoComplete="new-password" className={fieldControlClass} />
      </Field>
      <Field label="Repetir la nueva contraseña" htmlFor="confirmPassword">
        <input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" className={fieldControlClass} />
      </Field>

      <label className="flex items-center gap-2 text-small text-foreground-secondary">
        <input type="checkbox" name="revokeOtherSessions" className="size-4 rounded border-border" />
        Cerrar la sesión en los demás dispositivos
      </label>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
