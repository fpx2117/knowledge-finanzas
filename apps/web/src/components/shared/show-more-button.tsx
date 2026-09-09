"use client";

export function ShowMoreButton({ remaining, onClick }: { remaining: number; onClick: () => void }) {
  if (remaining <= 0) return null;
  return (
    <div className="flex justify-center pt-3">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-8 items-center rounded-md border border-border px-3 text-small font-medium text-foreground transition-colors hover:bg-secondary"
      >
        Ver más ({remaining} {remaining === 1 ? "restante" : "restantes"})
      </button>
    </div>
  );
}
