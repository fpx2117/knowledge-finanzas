import { formatMoney, formatMoneyList, formatPercent } from "../templates/format";
import { resolveDateRange, shiftRangeBack, type KaiDateRange } from "../resolver/normalize";
import type { KaiMetricValue } from "../domain/kai-response";
import type { KaiHandler } from "./types";

function periodVerb(range: KaiDateRange, verb: "gastar" | "ganar" | "ahorrar"): string {
  const past = verb === "gastar" ? "gastaste" : verb === "ganar" ? "ganaste" : "ahorraste";
  const running = verb === "gastar" ? "llevás gastados" : verb === "ganar" ? "llevás cobrados" : "llevás ahorrados";
  if (range.kind === "month" && range.label === "este mes") return `Este mes ${running}`;
  if (range.label === "hoy") return `Hoy ${past}`;
  if (range.label === "ayer") return `Ayer ${past}`;
  if (range.kind === "week") return `En los últimos 7 días ${past}`;
  return `${range.label[0].toUpperCase()}${range.label.slice(1)} ${past}`;
}

const metric = (values: KaiMetricValue[]): { values: KaiMetricValue[] } => ({ values });

export const getMonthExpenses: KaiHandler = async ({ ports, range }) => {
  const rows = await ports.getMonthlySummary(range);
  const list = rows.map((r) => ({ amount: r.expense, currencyCode: r.currencyCode }));
  return {
    source: "DATABASE",
    response: {
      type: "KAI_METRIC",
      state: "ANALYTICAL",
      title: "Gastos",
      body: rows.length
        ? `${periodVerb(range, "gastar")} ${formatMoneyList(list)}.`
        : `No tengo gastos registrados para ${range.label}.`,
      data: metric(list.map((m) => ({ label: `Gastos (${m.currencyCode})`, amount: m.amount, currencyCode: m.currencyCode }))),
      actions: [{ kind: "navigate", label: "Ver movimientos", route: "/transactions" }],
    },
  };
};

export const getMonthIncome: KaiHandler = async ({ ports, range }) => {
  const rows = await ports.getMonthlySummary(range);
  const list = rows.map((r) => ({ amount: r.income, currencyCode: r.currencyCode }));
  return {
    source: "DATABASE",
    response: {
      type: "KAI_METRIC",
      state: "ANALYTICAL",
      title: "Ingresos",
      body: rows.length
        ? `${periodVerb(range, "ganar")} ${formatMoneyList(list)}.`
        : `No tengo ingresos registrados para ${range.label}.`,
      data: metric(list.map((m) => ({ label: `Ingresos (${m.currencyCode})`, amount: m.amount, currencyCode: m.currencyCode }))),
      actions: [{ kind: "navigate", label: "Ver ingresos", route: "/income" }],
    },
  };
};

export const getNetCashflow: KaiHandler = async ({ ports, range }) => {
  const rows = await ports.getMonthlySummary(range);
  const list = rows.map((r) => ({ amount: r.net, currencyCode: r.currencyCode }));
  const positive = rows.every((r) => Number(r.net) >= 0);
  return {
    source: "CALCULATOR",
    response: {
      type: "KAI_METRIC",
      state: positive ? "POSITIVE" : "ANALYTICAL",
      title: "Resultado del mes",
      body: rows.length
        ? `${range.label[0].toUpperCase()}${range.label.slice(1)} tu resultado (ingresos − gastos) es ${formatMoneyList(list)}.`
        : `Todavía no tengo movimientos para calcular el resultado de ${range.label}.`,
      data: metric(list.map((m) => ({ label: `Resultado (${m.currencyCode})`, amount: m.amount, currencyCode: m.currencyCode }))),
    },
  };
};

export const getMonthSavings: KaiHandler = async ({ ports, range }) => {
  const rows = await ports.getMonthlySummary(range);
  if (!rows.length) {
    return {
      source: "CALCULATOR",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: `Todavía no tengo ingresos ni gastos registrados para ${range.label}.`,
      },
    };
  }
  const parts = rows.map((r) => {
    const income = Number(r.income);
    const savings = Number(r.net);
    const rate = income > 0 ? (savings / income) * 100 : 0;
    return { ...r, savings, rate };
  });
  const primary = parts[0];
  const improving = parts.every((p) => p.savings > 0);
  const rateText = primary.savings > 0 && Number(primary.income) > 0
    ? `, equivalente al ${formatPercent(primary.rate)} de tus ingresos`
    : "";
  return {
    source: "CALCULATOR",
    response: {
      type: "KAI_METRIC",
      state: improving ? "POSITIVE" : "ANALYTICAL",
      title: "Ahorro",
      body: `${periodVerb(range, "ahorrar")} ${formatMoneyList(parts.map((p) => ({ amount: String(p.savings), currencyCode: p.currencyCode })))}${rateText}.`,
      data: metric(parts.map((p) => ({
        label: `Ahorro (${p.currencyCode})`,
        amount: String(p.savings),
        currencyCode: p.currencyCode,
        hint: Number(p.income) > 0 ? `${formatPercent(p.rate)} de los ingresos` : undefined,
      }))),
    },
  };
};

export const getCurrentBalance: KaiHandler = async ({ ports }) => {
  const balances = await ports.getLiquidBalances();
  return {
    source: "DATABASE",
    response: {
      type: "KAI_METRIC",
      state: "NEUTRAL",
      title: "Saldo disponible",
      body: balances.length
        ? `Tenés ${formatMoneyList(balances)} entre todas tus cuentas líquidas.`
        : "Todavía no cargaste cuentas con saldo.",
      data: metric(balances.map((b) => ({ label: `Saldo (${b.currencyCode})`, amount: b.amount, currencyCode: b.currencyCode }))),
      actions: [{ kind: "navigate", label: "Ver cuentas", route: "/accounts" }],
    },
  };
};

export const getAccountBalances: KaiHandler = async ({ ports }) => {
  const accounts = await ports.getAccountBalances();
  return {
    source: "CALCULATOR",
    response: {
      type: "KAI_METRIC",
      state: "NEUTRAL",
      title: "Saldos por cuenta",
      body: accounts.length
        ? accounts.map((a) => `${a.name}: ${formatMoney(a.balance, a.currencyCode)}`).join(" · ")
        : "Todavía no cargaste cuentas.",
      data: metric(accounts.map((a) => ({ label: a.name, amount: a.balance, currencyCode: a.currencyCode }))),
      actions: [{ kind: "navigate", label: "Ver cuentas", route: "/accounts" }],
    },
  };
};

export const getTopBalanceAccount: KaiHandler = async ({ ports }) => {
  const accounts = await ports.getAccountBalances();
  if (!accounts.length) {
    return { source: "DATABASE", response: { type: "KAI_TEXT", state: "NEUTRAL", body: "Todavía no cargaste cuentas." } };
  }
  const top = [...accounts].sort((a, b) => Number(b.balance) - Number(a.balance))[0];
  return {
    source: "CALCULATOR",
    response: {
      type: "KAI_METRIC",
      state: "NEUTRAL",
      body: `Tu cuenta con más saldo es ${top.name} con ${formatMoney(top.balance, top.currencyCode)}.`,
      data: metric([{ label: top.name, amount: top.balance, currencyCode: top.currencyCode }]),
      actions: [{ kind: "navigate", label: "Ver cuentas", route: "/accounts" }],
    },
  };
};

export const getAvailableMoney: KaiHandler = async ({ ports }) => {
  const rows = await ports.getSpendable();
  const list = rows.map((r) => ({ amount: r.spendable, currencyCode: r.currencyCode }));
  return {
    source: "CALCULATOR",
    response: {
      type: "KAI_METRIC",
      state: "ANALYTICAL",
      title: "Disponible para gastar",
      body: rows.length
        ? `Descontando lo que tenés comprometido en los próximos 30 días, te queda ${formatMoneyList(list)} para gastar.`
        : "Necesito cuentas con saldo para estimar tu disponible.",
      data: metric(list.map((m) => ({ label: `Disponible (${m.currencyCode})`, amount: m.amount, currencyCode: m.currencyCode }))),
    },
  };
};

export const getCategoryExpenses: KaiHandler = async ({ ports, range, params }) => {
  const query = params.category?.trim();
  if (!query) {
    return {
      source: "DATABASE",
      response: { type: "KAI_TEXT", state: "NEUTRAL", body: "¿En qué categoría querés que mire?" },
    };
  }
  const result = await ports.getCategoryExpenses(range, query);
  if (!result) {
    // Not a category — maybe a merchant ("¿cuánto gasté en Starbucks?").
    const merchant = await ports.getMerchantExpenses(range, query);
    if (merchant && merchant.byCurrency.length) {
      return {
        source: "DATABASE",
        response: {
          type: "KAI_METRIC",
          state: "ANALYTICAL",
          title: merchant.label,
          body: `${range.label[0].toUpperCase()}${range.label.slice(1)} gastaste ${formatMoneyList(merchant.byCurrency)} en ${merchant.label} (${merchant.count} ${merchant.count === 1 ? "movimiento" : "movimientos"}).`,
          data: metric(merchant.byCurrency.map((m) => ({ label: `${merchant.label} (${m.currencyCode})`, amount: m.amount, currencyCode: m.currencyCode }))),
          actions: [{ kind: "navigate", label: "Ver movimientos", route: "/transactions" }],
        },
      };
    }
    return {
      source: "DATABASE",
      response: {
        type: "KAI_TEXT",
        state: "NEUTRAL",
        body: `No encontré una categoría ni un comercio que coincida con "${query}".`,
        actions: [{ kind: "navigate", label: "Ver categorías", route: "/categories" }],
      },
    };
  }
  return {
    source: "DATABASE",
    response: {
      type: "KAI_METRIC",
      state: "ANALYTICAL",
      title: result.label,
      body: `${range.label[0].toUpperCase()}${range.label.slice(1)} gastaste ${formatMoneyList(result.byCurrency)} en ${result.label}.`,
      data: metric(result.byCurrency.map((m) => ({ label: `${result.label} (${m.currencyCode})`, amount: m.amount, currencyCode: m.currencyCode }))),
      actions: [{ kind: "navigate", label: "Ver movimientos", route: "/transactions" }],
    },
  };
};

export const getTopExpenseCategories: KaiHandler = async ({ ports, range, baseCurrency }) => {
  const rows = await ports.getTopExpenseCategories(range, 12);
  if (!rows.length) {
    return {
      source: "DATABASE",
      response: { type: "KAI_TEXT", state: "NEUTRAL", body: `No tengo gastos categorizados para ${range.label}.` },
    };
  }

  // A chart is one currency only. Use whichever currency holds the most spend (usually the
  // base currency); note the rest instead of mixing them.
  const totalsByCurrency = new Map<string, number>();
  for (const r of rows) totalsByCurrency.set(r.currencyCode, (totalsByCurrency.get(r.currencyCode) ?? 0) + Number(r.amount));
  const chartCurrency =
    [...totalsByCurrency.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? baseCurrency;
  const excludedCurrencies = [...totalsByCurrency.keys()].filter((c) => c !== chartCurrency);

  const inCurrency = rows.filter((r) => r.currencyCode === chartCurrency).sort((a, b) => Number(b.amount) - Number(a.amount));
  const head = inCurrency.slice(0, 5);
  const tail = inCurrency.slice(5);
  const tailTotal = tail.reduce((sum, r) => sum + Number(r.amount), 0);
  const segments = [
    ...head.map((r) => ({ label: r.label, value: Number(r.amount), display: formatMoney(r.amount, chartCurrency) })),
    ...(tailTotal > 0 ? [{ label: "Otros", value: tailTotal, display: formatMoney(String(tailTotal), chartCurrency) }] : []),
  ];
  const total = inCurrency.reduce((sum, r) => sum + Number(r.amount), 0);
  const top = inCurrency[0];

  return {
    source: "DATABASE",
    response: {
      type: "KAI_CHART",
      state: "ANALYTICAL",
      title: "Gastos por categoría",
      body:
        `Tu mayor categoría ${range.label} fue ${top.label} con ${formatMoney(top.amount, chartCurrency)}` +
        (excludedCurrencies.length ? ` (no incluyo lo gastado en ${excludedCurrencies.join(", ")}).` : "."),
      data: {
        chart: {
          kind: "bar",
          currencyCode: chartCurrency,
          total: String(total),
          segments,
          ...(excludedCurrencies.length ? { excludedCurrencies } : {}),
        },
      },
      actions: [{ kind: "navigate", label: "Ver reporte por categoría", route: "/categories" }],
    },
  };
};

export const getLargestExpense: KaiHandler = async ({ ports, range }) => {
  const expenses = await ports.getRecentExpenses(range);
  if (!expenses.length) {
    return {
      source: "DATABASE",
      response: { type: "KAI_TEXT", state: "NEUTRAL", body: `No tengo gastos registrados para ${range.label}.` },
    };
  }
  const largest = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  const who = largest.merchant ?? largest.description ?? largest.categoryName ?? "un movimiento";
  return {
    source: "DATABASE",
    response: {
      type: "KAI_METRIC",
      state: "ANALYTICAL",
      body: `Tu mayor gasto ${range.label} fue ${formatMoney(largest.amount, largest.currencyCode)} en ${who}.`,
      data: metric([{ label: who, amount: largest.amount, currencyCode: largest.currencyCode }]),
      actions: [{ kind: "navigate", label: "Ver movimientos", route: "/transactions" }],
    },
  };
};

export const getYesterdayExpenses = getMonthExpenses;

export const getExpenseComparison: KaiHandler = async ({ ports, range, baseCurrency, now, timezone }) => {
  // The user names a period as the *baseline* ("¿gasté más que el mes pasado?"). Compare the
  // current period of that same kind against the previous one — not whatever `range` resolved to.
  const kind = range.kind === "quarter" ? "quarter" : range.kind === "year" ? "year" : "month";
  const currentRange = resolveDateRange(
    kind === "quarter" ? "este trimestre" : kind === "year" ? "este ano" : "este mes",
    now,
    timezone,
  );
  const previousRange = resolveDateRange(
    kind === "quarter" ? "el trimestre pasado" : kind === "year" ? "el ano pasado" : "el mes pasado",
    now,
    timezone,
  );
  const prev = { label: previousRange.label };

  const [current, previous] = await Promise.all([
    ports.getMonthlySummary({ from: currentRange.from, to: currentRange.to }),
    ports.getMonthlySummary({ from: previousRange.from, to: previousRange.to }),
  ]);
  const cur = current.find((r) => r.currencyCode === baseCurrency) ?? current[0];
  const pre = previous.find((r) => r.currencyCode === baseCurrency) ?? previous[0];
  range = currentRange;

  if (!cur || !pre || Number(pre.expense) === 0) {
    return {
      source: "CALCULATOR",
      response: {
        type: "KAI_TEXT",
        state: "ANALYTICAL",
        body: cur
          ? `${range.label[0].toUpperCase()}${range.label.slice(1)} gastaste ${formatMoney(cur.expense, cur.currencyCode)}. Todavía no tengo gastos en ${prev.label} para comparar.`
          : `No tengo gastos registrados para ${range.label}.`,
      },
    };
  }

  const curN = Number(cur.expense);
  const preN = Number(pre.expense);
  const variationPercent = ((curN - preN) / preN) * 100;
  const direction = Math.abs(variationPercent) < 1 ? "flat" : variationPercent > 0 ? "up" : "down";
  const word = direction === "up" ? "más" : direction === "down" ? "menos" : "casi lo mismo";

  return {
    source: "CALCULATOR",
    response: {
      type: "KAI_COMPARISON",
      state: direction === "up" ? "ALERT" : "POSITIVE",
      title: "Comparación de gastos",
      body:
        direction === "flat"
          ? `${range.label[0].toUpperCase()}${range.label.slice(1)} gastaste ${word} que ${prev.label}: ${formatMoney(cur.expense, cur.currencyCode)} vs ${formatMoney(pre.expense, pre.currencyCode)}.`
          : `${range.label[0].toUpperCase()}${range.label.slice(1)} gastaste un ${formatPercent(Math.abs(variationPercent))} ${word} que ${prev.label} (${formatMoney(cur.expense, cur.currencyCode)} vs ${formatMoney(pre.expense, pre.currencyCode)}).`,
      data: {
        current: cur.expense,
        previous: pre.expense,
        currencyCode: cur.currencyCode,
        variationPercent: Math.round(variationPercent * 10) / 10,
        direction,
      },
      actions: [{ kind: "navigate", label: "Ver reporte", route: "/reports" }],
    },
  };
};
