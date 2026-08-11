// Mobile: one task per screen (each step is its own route); Desktop: same routes. No
// confetti/gradients/bounces, prefers-reduced-motion respected (no animation exists here to
// respect it against). Reuses the app's existing standalone-page wrapper class (see
// apps/web/src/app/pricing/page.tsx) rather than inventing new, unstyled ones.
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <main className="content">{children}</main>;
}
