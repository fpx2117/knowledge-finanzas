"use client";

import { useActionState } from "react";
import { AGE_RANGES, EMPLOYMENT_STATUSES, HOUSEHOLD_SIZE_RANGES, INCOME_RANGES } from "@know-finanzas/privacy";
import { saveStatisticalProfileAction, type SaveStatisticalProfileState } from "../actions/save-profile";

const EMPLOYMENT_LABEL: Record<string, string> = {
  EMPLOYED_FULL_TIME: "Empleado/a tiempo completo",
  EMPLOYED_PART_TIME: "Empleado/a tiempo parcial",
  SELF_EMPLOYED: "Independiente / autónomo",
  UNEMPLOYED: "Desempleado/a",
  STUDENT: "Estudiante",
  RETIRED: "Jubilado/a",
  OTHER: "Otro",
  PREFER_NOT_TO_SAY: "Prefiero no decir",
};

const INCOME_LABEL: Record<string, string> = {
  LOW: "Bajo",
  LOWER_MIDDLE: "Medio-bajo",
  MIDDLE: "Medio",
  UPPER_MIDDLE: "Medio-alto",
  HIGH: "Alto",
  PREFER_NOT_TO_SAY: "Prefiero no decir",
};

const HOUSEHOLD_LABEL: Record<string, string> = {
  ONE: "1 persona",
  TWO: "2 personas",
  THREE_TO_FOUR: "3 a 4 personas",
  FIVE_PLUS: "5 o más personas",
  PREFER_NOT_TO_SAY: "Prefiero no decir",
};

export type StatisticalProfileInitialValues = {
  ageRange: string | null;
  employmentStatus: string | null;
  incomeRange: string | null;
  householdSizeRange: string | null;
  regionCode: string | null;
};

// Every field defaults to "Sin responder" (empty option) — never pre-checked toward an answer,
// and every field is skippable (Security Requirement: "no dark patterns... no oversized accept
// button"). This is purely optional context, never required to use the product.
export function StatisticalProfileForm({ initialValues }: { initialValues: StatisticalProfileInitialValues }) {
  const [state, formAction, pending] = useActionState<SaveStatisticalProfileState | null, FormData>(saveStatisticalProfileAction, null);

  return (
    <section className="detail-card">
      <p className="card-label">Perfil estadístico (opcional)</p>
      <p className="card-helper">
        Nunca es obligatorio y no afecta tu acceso al producto. Se usa solo de forma agregada y anónima, y podés dejar
        cualquier campo sin responder.
      </p>
      <form action={formAction}>
        <div className="field-group">
          <label htmlFor="profile-age-range">Rango de edad</label>
          <select id="profile-age-range" name="ageRange" defaultValue={initialValues.ageRange ?? ""}>
            <option value="">Sin responder</option>
            {AGE_RANGES.filter((value) => value !== "PREFER_NOT_TO_SAY").map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="profile-employment-status">Situación laboral</label>
          <select id="profile-employment-status" name="employmentStatus" defaultValue={initialValues.employmentStatus ?? ""}>
            <option value="">Sin responder</option>
            {EMPLOYMENT_STATUSES.filter((value) => value !== "PREFER_NOT_TO_SAY").map((value) => <option key={value} value={value}>{EMPLOYMENT_LABEL[value]}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="profile-income-range">Rango de ingresos</label>
          <select id="profile-income-range" name="incomeRange" defaultValue={initialValues.incomeRange ?? ""}>
            <option value="">Sin responder</option>
            {INCOME_RANGES.filter((value) => value !== "PREFER_NOT_TO_SAY").map((value) => <option key={value} value={value}>{INCOME_LABEL[value]}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="profile-household-size">Tamaño del hogar</label>
          <select id="profile-household-size" name="householdSizeRange" defaultValue={initialValues.householdSizeRange ?? ""}>
            <option value="">Sin responder</option>
            {HOUSEHOLD_SIZE_RANGES.filter((value) => value !== "PREFER_NOT_TO_SAY").map((value) => <option key={value} value={value}>{HOUSEHOLD_LABEL[value]}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="profile-region-code">País (código de 2 letras)</label>
          <input id="profile-region-code" name="regionCode" type="text" maxLength={2} placeholder="AR" defaultValue={initialValues.regionCode === "PREFER_NOT_TO_SAY" ? "" : (initialValues.regionCode ?? "")} />
        </div>

        {state?.ok === false && (
          <div className="form-alert" role="alert">
            <strong>{state.error.message}</strong>
          </div>
        )}
        {state?.ok === true && <p className="card-helper" role="status">Perfil guardado.</p>}

        <button className="secondary-button" type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar perfil"}
        </button>
      </form>
    </section>
  );
}
