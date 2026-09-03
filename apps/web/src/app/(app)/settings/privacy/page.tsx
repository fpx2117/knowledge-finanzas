import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { statisticalProfileRepository } from "@/lib/privacy/statistical-profile.instance";
import { analyticsConsentRepository, CURRENT_POLICY_VERSION } from "@/lib/privacy/analytics-consent.instance";
import { StatisticalProfileForm } from "@/features/privacy/components/statistical-profile-form";
import { ConsentToggle } from "@/features/privacy/components/consent-toggle";
import {
  grantExternalAggregatedStatisticsConsentAction,
  grantProductAnalyticsConsentAction,
  withdrawExternalAggregatedStatisticsConsentAction,
  withdrawProductAnalyticsConsentAction,
} from "@/features/privacy/actions/update-consent";

export default async function PrivacySettingsPage() {
  const user = await requireCurrentUser();
  const [profile, consents] = await Promise.all([
    statisticalProfileRepository.findForUser(user.id),
    analyticsConsentRepository.listForUser(user.id),
  ]);

  const productAnalyticsConsent = consents.find((consent) => consent.purpose === "PRODUCT_ANALYTICS");
  const externalStatisticsConsent = consents.find((consent) => consent.purpose === "EXTERNAL_AGGREGATED_STATISTICS");

  return (
    <>
      <div className="mb-7 flex gap-2 text-sm text-muted-foreground"><span>Configuración</span><span aria-hidden="true">/</span><span>Privacidad y datos</span></div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Tus datos, tus decisiones</p>
          <h1>Privacidad y datos</h1>
          <p className="mt-4 max-w-[490px] text-body-lg leading-relaxed text-muted-foreground">
            El perfil estadístico es siempre opcional y el consentimiento de analítica es independiente de los
            términos del servicio. Ninguno de los dos afecta tu acceso al producto financiero.
          </p>
        </div>
      </header>

      <ConsentToggle
        title="Analítica de producto"
        description="Nos ayuda a entender cómo se usa la app (por ejemplo, qué pantallas se visitan) para mejorarla. Nunca incluye montos, comercios ni notas."
        granted={productAnalyticsConsent?.status === "GRANTED"}
        grantedAt={productAnalyticsConsent?.grantedAt ?? null}
        policyVersion={productAnalyticsConsent?.policyVersion ?? CURRENT_POLICY_VERSION}
        onGrant={grantProductAnalyticsConsentAction}
        onWithdraw={withdrawProductAnalyticsConsentAction}
      />

      <div style={{ marginTop: 16 }}>
        <ConsentToggle
          title="Estadísticas agregadas externas"
          description="Permite que tus métricas financieras, ya agregadas y anonimizadas junto con las de muchos otros usuarios, puedan usarse en el futuro para estadísticas de mercado. No se vende ni publica nada todavía — este consentimiento solo habilita que tus datos futuros sean elegibles para ese proceso interno."
          granted={externalStatisticsConsent?.status === "GRANTED"}
          grantedAt={externalStatisticsConsent?.grantedAt ?? null}
          policyVersion={externalStatisticsConsent?.policyVersion ?? CURRENT_POLICY_VERSION}
          onGrant={grantExternalAggregatedStatisticsConsentAction}
          onWithdraw={withdrawExternalAggregatedStatisticsConsentAction}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <StatisticalProfileForm
          initialValues={{
            ageRange: profile?.ageRange ?? null,
            employmentStatus: profile?.employmentStatus ?? null,
            incomeRange: profile?.incomeRange ?? null,
            householdSizeRange: profile?.householdSizeRange ?? null,
            regionCode: profile?.regionCode ?? null,
          }}
        />
      </div>
    </>
  );
}
