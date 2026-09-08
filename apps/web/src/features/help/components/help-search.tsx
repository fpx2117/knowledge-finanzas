"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { fieldControlClass } from "@/components/shared/form-field";
import type { HelpArticle } from "../articles";

// spec 12 §6.2/§6.4 — el buscador del Centro de ayuda. V1: coincidencia por texto normalizado
// (acento-insensible, case-insensitive) sobre título, resumen y categoría. NLP / sinónimos /
// tolerancia a typos son P1.
const ACCENTS: Record<string, string> = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u", ñ: "n" };

function normalize(value: string): string {
  return value.toLowerCase().replace(/[áéíóúüñ]/g, (ch) => ACCENTS[ch] ?? ch).trim();
}

export function HelpSearch({ articles }: { articles: HelpArticle[] }) {
  const [query, setQuery] = useState("");
  const q = normalize(query);

  const results = useMemo(() => {
    if (q.length < 2) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    return articles.filter((article) => {
      const haystack = normalize(`${article.title} ${article.body} ${article.category}`);
      return terms.every((term) => haystack.includes(term));
    });
  }, [q, articles]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-h3 text-foreground">¿Cómo podemos ayudarte?</h2>
        <div className="relative mt-2">
          <SearchIcon aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en la ayuda…"
            aria-label="Buscar en la ayuda"
            className={`${fieldControlClass} pl-9`}
          />
        </div>
      </div>

      {q.length >= 2 ? (
        <SectionCard title={`Resultados (${results.length})`}>
          {results.length === 0 ? (
            <p className="text-small text-muted-foreground">
              No encontramos un artículo para eso. Probá con otras palabras o mirá{" "}
              <Link href="/help/troubleshoot" className="font-medium text-brand hover:underline">
                Resolver un problema
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {results.map((article) => (
                <li key={article.title} className="flex flex-col gap-1">
                  <Link href={article.href} className="text-small font-medium text-foreground hover:text-brand hover:underline">
                    {article.title}
                  </Link>
                  <p className="text-small text-muted-foreground">{article.body}</p>
                  <span className="text-caption text-muted-foreground">{article.category}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      ) : null}
    </div>
  );
}
