import { TabBar } from "@/components/shared/tab-bar";

// spec 09 §4.1 / §11.1 — the three Insights subviews as in-page tabs (the types of insight are
// filters, never sidebar entries — §4.1).
export function InsightsTabs({ active }: { active: "para-vos" | "oportunidades" | "historial" }) {
  return (
    <TabBar
      active={active}
      tabs={[
        { key: "para-vos", label: "Para vos", href: "/insights" },
        { key: "oportunidades", label: "Oportunidades", href: "/insights/opportunities" },
        { key: "historial", label: "Historial", href: "/insights/history" },
      ]}
    />
  );
}
