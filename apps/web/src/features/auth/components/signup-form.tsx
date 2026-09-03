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
  name: z.string().trim().min(1, "Ingresá tu nombre"),
  email: z.string().min(1, "Ingresá tu email").email("Email inválido"),
  password: z.string().min(8, "Usá al menos 8 caracteres"),
});

type Values = z.infer<typeof schema>;

export function SignupForm({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setFormError(null);
    const { error } = await authClient.signUp.email({ name: values.name, email: values.email, password: values.password });
    if (error) {
      setFormError(error.message ?? "No pudimos crear tu cuenta. Probá de nuevo.");
      return;
    }
    router.push(callbackURL);
    router.refresh();
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <AuthField label="Nombre" autoComplete="name" placeholder="Tu nombre" error={errors.name?.message} {...register("name")} />
      <AuthField label="Email" type="email" autoComplete="email" placeholder="vos@ejemplo.com" error={errors.email?.message} {...register("email")} />
      <AuthField label="Contraseña" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
      {formError ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-small text-[var(--negative)]">
          {formError}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creando tu cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
