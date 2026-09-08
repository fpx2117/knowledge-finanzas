// spec 12 §5.3 — artículos destacados iniciales. Contenido estático (sin CMS todavía): cada uno
// es una respuesta corta y verificable + un link a la superficie del producto donde se ve.
export type HelpArticle = { title: string; body: string; category: string; href: string };

export const HELP_ARTICLES: HelpArticle[] = [
  {
    title: "Cómo crear tu primera cuenta",
    body: "En Cuentas → Nueva cuenta cargás nombre, tipo, moneda y saldo inicial. El saldo de la app se deriva del ledger a partir de ahí.",
    category: "Empezar",
    href: "/accounts/new",
  },
  {
    title: "Cómo registrar un gasto",
    body: "Tocá Registrar (o la tecla N), elegí Gasto, poné monto, en qué, cuenta y fecha. La categoría se infiere del comercio si la dejás en automática.",
    category: "Registrar",
    href: "/transactions/new?type=EXPENSE",
  },
  {
    title: "Cómo registrar una transferencia entre tus cuentas",
    body: "Una transferencia es una sola operación con dos efectos enlazados. No cuenta como ingreso ni como gasto en tus reportes.",
    category: "Registrar",
    href: "/transactions/transfers/new",
  },
  {
    title: "Cómo funciona el dinero disponible",
    body: "Es tu saldo confirmado menos las obligaciones comprometidas de los próximos 30 días. No incluye ingresos futuros.",
    category: "Reportes",
    href: "/app",
  },
  {
    title: "Cómo funciona el saldo proyectado",
    body: "Suma a tu saldo actual los eventos futuros (obligaciones, programados, recurrencias). Es una proyección, nunca se mezcla con lo confirmado.",
    category: "Calendario",
    href: "/calendar",
  },
  {
    title: "Por qué un pago de deuda no aparece como gasto",
    body: "La obligación futura ya redujo tu dinero disponible. Cuando la pagás, la salida real reemplaza ese compromiso — nunca se descuentan las dos cosas.",
    category: "Obligaciones",
    href: "/obligations",
  },
  {
    title: "Por qué no se suman mis cuentas en pesos y en dólares",
    body: "KnowFinanzas nunca combina monedas sin una conversión explícita. Cada moneda se muestra por separado.",
    category: "Cuentas",
    href: "/accounts",
  },
  {
    title: "Cómo importar movimientos desde CSV",
    body: "En Configuración → Importaciones subís el CSV del banco. Se detectan las columnas solas, ves una vista previa y se saltean los duplicados.",
    category: "Importaciones",
    href: "/settings/imports",
  },
  {
    title: "Cómo corregir una categoría",
    body: "Abrí el movimiento y cambiá la categoría. Si querés que se aplique siempre a ese comercio, creá una regla en Configuración → Reglas.",
    category: "Categorías y reglas",
    href: "/settings/rules",
  },
  {
    title: "Cómo registrar un pago parcial de una obligación",
    body: "Desde la obligación, registrás un pago por el monto real. La cuota queda parcialmente cubierta y el resto sigue pendiente.",
    category: "Obligaciones",
    href: "/obligations",
  },
  {
    title: "Cómo crear un presupuesto",
    body: "En Presupuestos definís un límite por categoría. El consumo se calcula con tus gastos confirmados del mes.",
    category: "Presupuestos",
    href: "/budgets/new",
  },
  {
    title: "Cómo funcionan los insights",
    body: "Son observaciones deterministas con evidencia (presupuesto al límite, riesgo de caja, meta atrasada). Cada una explica de dónde sale.",
    category: "Insights",
    href: "/insights",
  },
];
