import { describe, expect, it } from "vitest";
import { ApplicationError } from "@know-finanzas/shared";
import { createAccountSchema } from "../../apps/web/src/features/accounts/schemas/account-schemas";
import { createAccountService } from "../../apps/web/src/features/accounts/services/account-service";

const validInput = {
  name: "Cuenta principal",
  type: "BANK" as const,
  currencyCode: "ARS",
  openingBalance: "1000.00",
  openingDate: "2026-01-01",
};

function createFakeRepository() {
  const created: unknown[] = [];
  return {
    created,
    create: async (input: unknown) => { created.push(input); return input as never; },
    findByIdForUser: async () => undefined,
    listForUser: async () => [],
    updateMetadataForUser: async () => undefined,
    archiveForUser: async () => undefined,
    getBalanceInputsForUser: async () => [],
  };
}

describe("account input and service", () => {
  it("accepts zero opening balance and keeps it as a string", async () => {
    const repository = createFakeRepository();
    const service = createAccountService({ accounts: repository });
    const input = createAccountSchema.parse({ ...validInput, openingBalance: "0" });

    await service.createAccount("00000000-0000-0000-0000-000000000001", input);

    expect(repository.created[0]).toMatchObject({ userId: "00000000-0000-0000-0000-000000000001", openingBalance: "0" });
  });

  it("rejects unsupported currencies before persistence", async () => {
    const repository = createFakeRepository();
    const service = createAccountService({ accounts: repository });

    await expect(service.createAccount("00000000-0000-0000-0000-000000000001", { ...validInput, currencyCode: "XXX" })).rejects.toMatchObject<ApplicationError>({ code: "INVALID_INPUT", field: "currencyCode" });
    expect(repository.created).toHaveLength(0);
  });

  it("rejects negative opening balances at the input boundary", () => {
    expect(() => createAccountSchema.parse({ ...validInput, openingBalance: "-1" })).toThrow();
  });
});
