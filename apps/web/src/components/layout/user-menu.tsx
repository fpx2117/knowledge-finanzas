"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDownIcon, LogOutIcon, SettingsIcon, UserRoundIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/client";

const SETTINGS_LINKS = [
  { label: "Categorías", href: "/settings/categories" },
  { label: "Reglas automáticas", href: "/settings/rules" },
  { label: "Notificaciones", href: "/settings/notifications" },
  { label: "Suscripción", href: "/settings/plan" },
  { label: "Referidos", href: "/settings/referrals" },
  { label: "Privacidad y datos", href: "/settings/privacy" },
];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserMenu({ name, email, image }: { name: string; email: string; image?: string | null }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary">
        <Avatar className="size-9">
          {image ? <AvatarImage src={image} alt="" /> : null}
          <AvatarFallback className="bg-brand-subtle text-caption font-medium text-brand">
            {initials(name) || <UserRoundIcon className="size-4" />}
          </AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-small font-medium text-foreground">{name}</span>
          <span className="truncate text-caption text-muted-foreground">Ver perfil</span>
        </span>
        <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate text-small font-medium text-foreground">{name}</span>
          <span className="truncate text-caption font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-caption font-normal uppercase tracking-wider text-muted-foreground">
          <SettingsIcon className="size-3.5" /> Configuración
        </DropdownMenuLabel>
        {SETTINGS_LINKS.map((link) => (
          <DropdownMenuItem key={link.href} render={<Link href={link.href}>{link.label}</Link>} />
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOutIcon className="size-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
