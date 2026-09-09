import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/require-current-user";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackURL?: string }> }) {
  const { callbackURL } = await searchParams;

  // Already signed in (verified against the session, not just a cookie) → skip the form.
  // Only ever redirect to an in-app path so a crafted ?callbackURL can't bounce elsewhere.
  const user = await getCurrentUser();
  if (user) {
    const target = callbackURL && callbackURL.startsWith("/") && !callbackURL.startsWith("//") ? callbackURL : "/app";
    redirect(target);
  }
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
