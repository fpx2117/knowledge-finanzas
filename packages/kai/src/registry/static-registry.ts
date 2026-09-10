import type { KaiResponse } from "../domain/kai-response";
import type { KaiScreenContext } from "../domain/kai-context";
import { normalizeText } from "../resolver/normalize";

/**
 * Level 0 — static / local responses (spec §3 LEVEL 0). Greetings, navigation help,
 * "¿qué es esto?", FAQ and product questions. Cost: $0, latency ~0, never an LLM.
 */

const nav = (label: string, route: string) => ({ kind: "navigate" as const, label, route });

/** "¿Qué es esta pantalla?" — one entry per screen context (spec §10). */
export const KAI_SCREEN_HELP: Record<KaiScreenContext, KaiResponse> = {
  DASHBOARD: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Resumen",
    body: "Esta pantalla junta tu foto financiera del momento: saldos, resultado del mes, disponible y próximos vencimientos.",
  },
  ACCOUNTS: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Cuentas",
    body: "Acá administrás tus cuentas (bancos, efectivo, billeteras y ahorros) y ves el saldo de cada una.",
    actions: [nav("Agregar una cuenta", "/accounts")],
  },
  TRANSACTIONS: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Transacciones",
    body: "Esta pantalla reúne todos tus movimientos: ingresos, gastos y transferencias. Podés filtrarlos y categorizarlos.",
    actions: [nav("Registrar un movimiento", "/transactions")],
  },
  BUDGETS: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Presupuestos",
    body: "Los presupuestos te dejan poner un límite de gasto mensual por categoría y ver cuánto llevás usado.",
  },
  OBLIGATIONS: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Obligaciones",
    body: "Acá ves lo que tenés comprometido a futuro: cuotas de deudas, gastos programados y suscripciones, ordenados por vencimiento.",
  },
  CALENDAR: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Calendario",
    body: "El calendario muestra tus ingresos, gastos y vencimientos ubicados en el día que ocurren.",
  },
  GOALS: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Metas",
    body: "Las metas te ayudan a ahorrar para un objetivo con una fecha y un monto; KAI te muestra si vas al ritmo necesario.",
  },
  REPORTS: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Reportes",
    body: "Los reportes analizan tu historial: gastos por categoría, ingresos, flujo de caja y patrimonio.",
  },
  INSIGHTS: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Insights",
    body: "Los insights son observaciones automáticas sobre tus finanzas: subas de gasto, presupuestos al límite, metas y vencimientos.",
  },
  SETTINGS: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Ajustes",
    body: "Desde Ajustes configurás tu perfil, notificaciones, plan y preferencias de la aplicación.",
  },
  HELP: {
    type: "KAI_NAVIGATION", state: "NEUTRAL", title: "Ayuda",
    body: "En Ayuda encontrás guías y diagnósticos para entender por qué un saldo no coincide o cómo empezar.",
  },
  UNKNOWN: {
    type: "KAI_TEXT", state: "NEUTRAL",
    body: "Soy KAI, tu asistente de KnowFinanzas. Puedo contarte cómo venís de gastos, saldo, presupuestos, metas y vencimientos.",
  },
};

type StaticEntry = { match: string[]; response: KaiResponse };

/** Phrase → canned answer. Phrases are pre-normalised; matched by `includes`. */
const STATIC_ENTRIES: StaticEntry[] = [
  {
    match: ["hola", "buenas", "buen dia", "buenas tardes", "que tal", "como estas"],
    response: {
      type: "KAI_TEXT", state: "NEUTRAL",
      body: "¡Hola! Soy KAI. Preguntame cómo venís este mes, cuánto tenés disponible o qué se te vence pronto.",
    },
  },
  {
    match: ["gracias", "muchas gracias", "genial", "perfecto"],
    response: { type: "KAI_TEXT", state: "POSITIVE", body: "¡De nada! Cualquier cosa, acá estoy." },
  },
  {
    match: ["que podes hacer", "que sabes hacer", "para que servis", "ayuda", "en que me podes ayudar"],
    response: {
      type: "KAI_TEXT", state: "NEUTRAL", title: "Qué puedo hacer",
      body: "Puedo responder sobre tus gastos e ingresos del mes, tu ahorro, tu saldo y disponible, tus presupuestos, tus metas, tus suscripciones y tus próximos vencimientos. También te llevo a la pantalla que necesitás.",
    },
  },
  {
    match: ["donde agrego una cuenta", "como agrego una cuenta", "crear una cuenta", "agregar cuenta", "nueva cuenta"],
    response: {
      type: "KAI_NAVIGATION", state: "NEUTRAL",
      body: "Podés agregar una cuenta desde la sección Cuentas.",
      actions: [nav("Ir a Cuentas", "/accounts")],
    },
  },
  {
    // Only the bare "how do I…" question lands here; a concrete "registrá un gasto de $X en Y"
    // is caught earlier by parseWriteIntent and answered with a confirmation card.
    match: ["donde registro un gasto", "donde cargo un gasto", "donde anoto un gasto", "donde registro un ingreso"],
    response: {
      type: "KAI_ACTION", state: "NEUTRAL",
      body: "Podés registrar un movimiento con el botón + Registrar (o la tecla N) desde cualquier pantalla. También podés pedírmelo directamente, por ejemplo: \"gasté $3.000 en el super\".",
      actions: [{ kind: "open-quick-add", label: "Registrar un movimiento", params: { type: "EXPENSE" } }],
    },
  },
  {
    match: ["como creo un presupuesto", "crear presupuesto", "nuevo presupuesto", "armar un presupuesto"],
    response: {
      type: "KAI_NAVIGATION", state: "NEUTRAL",
      body: "Creá un presupuesto por categoría desde la sección Presupuestos.",
      actions: [nav("Ir a Presupuestos", "/budgets")],
    },
  },
  {
    match: ["como creo una meta", "crear meta", "nueva meta de ahorro", "armar una meta"],
    response: {
      type: "KAI_NAVIGATION", state: "NEUTRAL",
      body: "Creá una meta de ahorro desde la sección Metas: le ponés un nombre, un monto objetivo y una fecha.",
      actions: [nav("Ir a Metas", "/goals")],
    },
  },
  {
    match: ["que plan tengo", "mi plan", "cambiar de plan", "planes", "cuanto sale pro", "precio"],
    response: {
      type: "KAI_NAVIGATION", state: "NEUTRAL",
      body: "Podés ver tu plan actual y los detalles de PRO en Ajustes → Plan.",
      actions: [nav("Ver mi plan", "/settings/plan")],
    },
  },
  {
    match: ["que son los creditos", "para que son los creditos de ia", "como funcionan los creditos"],
    response: {
      type: "KAI_TEXT", state: "NEUTRAL",
      body: "Los créditos de IA se usan solo cuando una pregunta necesita un análisis abierto. La mayoría de tus consultas las respondo con tus datos, sin gastar créditos.",
    },
  },
  {
    match: ["usas mis datos", "de donde sacas la informacion", "como sabes esto", "es seguro"],
    response: {
      type: "KAI_TEXT", state: "NEUTRAL",
      body: "Respondo solo con los datos que registraste en KnowFinanzas. Los cálculos son siempre sobre tu información y no se comparten con terceros.",
    },
  },
];

/**
 * Tries to answer from the static layer. Returns null if nothing matched — the caller
 * then moves on to the deterministic intents and, last, the LLM.
 */
export function resolveStatic(rawMessage: string, screenContext: KaiScreenContext): KaiResponse | null {
  const normalized = normalizeText(rawMessage);
  if (!normalized) return null;

  for (const entry of STATIC_ENTRIES) {
    if (entry.match.some((phrase) => normalized.includes(phrase))) return entry.response;
  }

  if (/\b(que es esto|que es esta pantalla|para que sirve esta pantalla|donde estoy|que hago aca)\b/.test(normalized)) {
    return KAI_SCREEN_HELP[screenContext];
  }

  return null;
}
