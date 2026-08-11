"use client";

import { useState } from "react";

export function ReferralLinkCard({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, non-secure context) — the URL is still visible and
      // selectable in the input, so this is never a dead end for the user.
    }
  }

  return (
    <section className="detail-card">
      <p className="card-label">Tu enlace de referidos</p>
      <div className="field-group">
        <input type="text" value={shareUrl} readOnly onFocus={(event) => event.currentTarget.select()} aria-label="Enlace de referidos" />
      </div>
      <button className="secondary-button" type="button" onClick={handleCopy}>
        {copied ? "¡Copiado!" : "Copiar enlace"}
      </button>
    </section>
  );
}
