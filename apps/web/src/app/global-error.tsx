"use client";

// Last-resort boundary for errors thrown in the root layout itself. It replaces
// the whole document, so it must render its own <html>/<body>. Route-level
// error.tsx files handle everything below the layout. Colours come from the
// design tokens (globals.css is still injected here); `color-scheme` lets the
// browser paint a matching ground if a token ever fails to resolve.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es" style={{ colorScheme: "light dark" }}>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "var(--background)", color: "var(--foreground)" }}>
        <main
          style={{
            minHeight: "100svh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Algo salió mal</h1>
          <p style={{ maxWidth: "28rem", color: "var(--muted-foreground)" }}>
            Ocurrió un error inesperado. Tus datos financieros están a salvo.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "0.5rem",
              height: "2.75rem",
              padding: "0 1.25rem",
              borderRadius: "0.5rem",
              border: 0,
              background: "var(--brand)",
              color: "var(--primary-foreground)",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
