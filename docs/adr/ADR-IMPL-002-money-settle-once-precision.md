# ADR-IMPL-002 — Money: redondear una sola vez, al final ("settle-once")

- **Estado:** Accepted (2026-09-04)
- **Contexto de decisión:** WP-MONEY-SCALE (`docs/implementation/10-work-packages.md`)
- **Autoridad:** `docs/00-product-foundation.md` §14 invariante 1 ("aritmética decimal exacta") ·
  spec 14 §4.1
- **Decisión del usuario:** la base de datos debe preservar sub-centavos — no sólo para splits,
  sino para poder representar pagos supuestos/estimados y agregados estadísticos completos.

## Problema

`Money` redondeaba a los decimales de la moneda (2 para ARS/USD) **en cada operación** —
en el constructor, y por lo tanto en cada `add`/`subtract` (que construyen un `Money` nuevo).
El valor redondeado era lo único que existía: se comparaba, se mostraba y se persistía igual.
La columna de DB ya es `numeric(20,6)` pero nunca recibía más de 2 decimales reales.

Efecto concreto: una cadena de operaciones sobre montos que legítimamente tuvieran sub-centavo
(pagos estimados, prorrateos, agregados estadísticos) perdía esa precisión en el primer paso,
no al final. En el caso límite, varios cargos sub-centavo reales podían "desaparecer" a cero
en vez de acumularse a un centavo real (demostrado en
`tests/unit/finance-money.test.ts` → "three sub-cent amounts accumulate to a real cent instead
of rounding away to zero at each step").

## Decisión

**"Settle-once":** `Money.amount` pasa a ser el valor **exacto, sin redondear** (decimal.js,
precisión arbitraria). El redondeo a los decimales de la moneda ocurre **una sola vez**, en el
límite de salida: `toString()` (lo que se persiste/muestra) y `split()` (que produce N montos
reales pagables, así que primero se asienta el valor de origen a los decimales de la moneda,
igual que antes — una cuota de deuda siempre fue y sigue siendo un monto de centavos exactos).

```
ANTES:  a.add(b).subtract(c)  →  cada paso redondea a 2 decimales
AHORA:  (a + b - c)           →  se computa exacto; se redondea una sola vez en toString()
```

## Alcance explícitamente descartado (por ahora)

Se evaluaron y se descartaron dos alternativas de mayor alcance:

1. **Persistir precisión completa (6 decimales) en todo monto** — `Money.toString()` devolviendo
  hasta 6 decimales siempre. Habría roto ~800 aserciones de test que esperan `"X.00"` y exigido
  un formateador de display nuevo en cada pantalla que muestra un monto (riesgo de mostrarle al
  usuario `"$700.000000"` si se olvida alguno). Rechazado: alto riesgo/alcance para un problema
  que "settle-once" ya resuelve sin tocar ninguna pantalla.
2. **Tipo de alta precisión separado sólo para proyecciones/estadística** — viable a futuro
  (Fases D/F/16), pero no resuelve el problema real hoy: el ledger de transacciones confirmadas
  (`transactions`, `debt_payments`, `transfers`) también encadena `add`/`subtract` (balances,
  allocations) y se beneficia de la misma corrección.

## Implementación

- `packages/finance/src/money/money.ts`: constructor privado deja de llamar `roundAmount`;
  `toString()` pasa a `roundAmount(this.amount, this.currency).toFixed(decimalPlaces)`; `split()`
  asienta (`roundAmount`) el valor de origen antes de dividir.
- `packages/finance/src/money/rounding.ts`: sin cambios — `roundAmount`/`splitAmount` se llaman
  desde un punto distinto, no cambia su semántica.
- Ningún call site externo requirió cambios: los usos directos de `.amount` en el resto del
  monorepo son comparaciones/predicados (`isZero`, `isNegative`, `compareTo`, `gt`, `lte`,
  `dividedBy`), nunca display — todos se vuelven **más correctos** al operar sobre el valor exacto
  en vez del ya-redondeado.

## Consecuencias

- **Sin cambios de comportamiento observable hoy:** cada valor que hoy existe en la base ya nació
  de un `Money.toString()` de 2 decimales, así que redondear una vez al final da el mismo
  resultado que redondear en cada paso — confirmado por 0 regresiones en 800 tests unit + 19
  integration tras el cambio.
- **Beneficio real es hacia adelante:** cuando se construyan features que legítimamente producen
  sub-centavo (prorrateos, estimaciones recurrentes, agregados de privacy/analytics — Fases D/F/16),
  `Money` ya no destruye esa precisión en el primer paso de cálculo.
- `Money.equals()`/`compareTo()` ahora comparan el valor exacto, no el redondeado — estrictamente
  más correcto; ningún dato existente lo ejercita de forma distinta (ver arriba).

## Reversibilidad

Bajo riesgo: revertir es un cambio de una función (`toString`) y un método (`split`) en un único
archivo, sin migración de datos (la columna DB no cambió).
