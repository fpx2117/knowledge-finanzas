import Link from "next/link";

import { cn } from "@/lib/utils";

// Link-based tab bar — visual-design-personal.md §25 (TabBar). Server-friendly:
// each tab is a URL, the active one is passed in. Underline indicator, calm.
export function TabBar({
  tabs,
  active,
}: {
  tabs: Array<{ label: string; href: string; key: string }>;
  active: string;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-small font-medium transition-colors",
            tab.key === active
              ? "border-primary text-brand"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
