import Link from "next/link";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";

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
      <LoginForm callbackURL={callbackURL || "/dashboard"} />
    </AuthLayout>
  );
}
