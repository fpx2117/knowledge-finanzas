"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDownIcon, LogOutIcon, UserRoundIcon } from "lucide-react";

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

// Spec 13 §18.2 — deliberately short: identity, then Configuración / Plan / Ayuda, then Cerrar
// sesión. The full settings surface lives on the /settings hub, never in this dropdown (§18.3:
// no financial data, no oversized link lists, no admin links for normal users).
const MENU_LINKS = [
  { label: "Configuración", href: "/settings" },
  { label: "Plan", href: "/settings/plan" },
  { label: "Ayuda", href: "/help" },
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
    // §18.4 — invalidate the session, then a full refresh so no navigable cache can show private
    // data on Back.
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
        {MENU_LINKS.map((link) => (
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
