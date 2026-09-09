import Link from "next/link";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";

// NOTE: no "already logged in → /app" redirect here. It used to live in middleware keyed on
// cookie *presence* and caused a redirect loop with a stale cookie (see middleware.ts). A
// genuinely logged-in visitor landing on /login just sees the form; submitting it is harmless.
// Cross-tab sign-out (SessionSync) also lands here and must stay put (spec 13 §29.5).
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackURL?: string }> }) {
  const { callbackURL } = await searchParams;
  return (
    <AuthLayout
      title="Iniciá sesión"
      subtitle="Accedé a tu panel financiero."
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Creá una
          </Link>
        </>
      }
    >
      <LoginForm callbackURL={callbackURL || "/app"} />
    </AuthLayout>
  );
}
