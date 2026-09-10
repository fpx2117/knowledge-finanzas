"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Renders a brand logo (`src`) and swaps to `fallback` the moment it fails to load — so a missing
 * or generic logo.dev result degrades to a monogram chip / icon instead of a broken image. `src`
 * of `null` renders the fallback straight away.
 */
export function BrandLogoImg({
  src,
  alt = "",
  fallback,
  className,
}: {
  src: string | null;
  alt?: string;
  fallback: React.ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  return (
    // Plain <img>: logo.dev already serves a sized/optimised PNG, and next/image would need
    // remotePatterns config + an optimiser round-trip for a 32px mark.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("shrink-0 bg-card object-contain", className)}
    />
  );
}
