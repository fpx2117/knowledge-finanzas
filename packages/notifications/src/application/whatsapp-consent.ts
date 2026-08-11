import { NotificationError } from "../errors";

// E.164, mirroring the DB check constraint (packages/db/src/schema.ts) so an invalid phone
// number is rejected with a normalized error before it ever reaches Postgres.
const E164_PATTERN = /^\+[1-9][0-9]{6,14}$/;

export type WhatsappConsentRepository = {
  optInWhatsapp(userId: string, phoneNumber: string, optInAt: Date): Promise<unknown>;
  optOutWhatsapp(userId: string, optOutAt: Date): Promise<unknown>;
};

export function createWhatsappConsentService(dependencies: { consent: WhatsappConsentRepository; now?: () => Date }) {
  const now = dependencies.now ?? (() => new Date());

  return {
    async optIn(input: { userId: string; phoneNumber: string }) {
      if (!E164_PATTERN.test(input.phoneNumber)) throw new NotificationError("WHATSAPP_INVALID_PHONE", { field: "phoneNumber" });
      return dependencies.consent.optInWhatsapp(input.userId, input.phoneNumber, now());
    },

    optOut(input: { userId: string }) {
      return dependencies.consent.optOutWhatsapp(input.userId, now());
    },
  };
}
