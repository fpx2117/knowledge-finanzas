"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { provisionDefaultCategoriesAction } from "../actions/category-actions";

/**
 * One-tap starter categories for a user who has none yet. Used in the "necesitás
 * una categoría" empty states of the transaction and budget forms while a full
 * category manager is not rebuilt.
 */
export function GenerateCategoriesButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      size={size}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await provisionDefaultCategoriesAction();
          if (result.ok) router.refresh();
        })
      }
    >
      <SparklesIcon className="size-4" />
      {pending ? "Generando…" : "Generar categorías sugeridas"}
    </Button>
  );
}
