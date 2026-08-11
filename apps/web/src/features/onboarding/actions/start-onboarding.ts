"use server";

import { redirect } from "next/navigation";

// A CTA-friendly Server Action wrapper — the actual start/resume/analytics logic lives in
// /onboarding/page.tsx (the one entry point every path, including this, funnels through), so
// there's exactly one place that decides "is this a first start or a resume."
export async function startOnboardingAction() {
  redirect("/onboarding");
}
