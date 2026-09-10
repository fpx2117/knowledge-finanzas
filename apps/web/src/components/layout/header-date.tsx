"use client";

import { useEffect, useState } from "react";

// Reference topbar carries the current date on the right. Rendered after mount so the server
// markup (which has no stable "now") never mismatches the client.
export function HeaderDate() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const formatted = new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());
    setLabel(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  if (!label) return null;
  return (
    <>
      <span className="hidden text-caption text-foreground-muted xl:inline">{label}</span>
      <span aria-hidden className="hidden h-6 w-px bg-border xl:inline-block" />
    </>
  );
}
