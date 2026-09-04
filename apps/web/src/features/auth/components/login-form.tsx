"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { AuthField } from "./auth-field";

const schema = z.object({
  email: z.string().min(1, "Ingresá tu email").email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

type Values = z.infer<typeof schema>;

export function LoginForm({ callbackURL = "/app" }: { callbackURL?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setFormError(null);
    const { error } = await authClient.signIn.email({ email: values.email, password: values.password });
    if (error) {
      setFormError("Email o contraseña incorrectos.");
      return;
    }
    router.push(callbackURL);
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <AuthField label="Email" type="email" autoComplete="email" placeholder="vos@ejemplo.com" error={errors.email?.message} {...register("email")} />
      <AuthField label="Contraseña" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
      {formError ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Ingresando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
