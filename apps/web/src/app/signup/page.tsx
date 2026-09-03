import Link from "next/link";

import { AuthLayout } from "@/features/auth/components/auth-layout";
import { SignupForm } from "@/features/auth/components/signup-form";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ callbackURL?: string }> }) {
  const { callbackURL } = await searchParams;
  return (
    <AuthLayout
      title="Creá tu cuenta"
      subtitle="Empezá a ver tu situación financiera con claridad."
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Iniciá sesión
          </Link>
        </>
      }
    >
      <SignupForm callbackURL={callbackURL || "/dashboard"} />
    </AuthLayout>
  );
}
