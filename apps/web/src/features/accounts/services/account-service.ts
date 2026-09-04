import { calculateAssetAccountBalance, getCurrencyMetadata, parseLocalDate } from "@know-finanzas/finance";
import { ApplicationError } from "@know-finanzas/shared";

import { allowAllProductAccessGate, type ProductAccessGate } from "@/lib/billing/product-access-gate";
import type { CreateAccountInput } from "../schemas/account-schemas";

type AccountType = "CASH" | "BANK" | "DIGITAL_WALLET" | "SAVINGS";
type AccountStatus = "ACTIVE" | "ARCHIVED";

type AccountRecord = {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currencyCode: string;
  openingBalance: string;
  openingDate: string;
  status: AccountStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BalanceInput = {
  account: AccountRecord;
  incomeTotal: string;
  expenseTotal: string;
  refundTotal?: string;
  adjustmentInTotal?: string;
  adjustmentOutTotal?: string;
  transferInTotal?: string;
  transferOutTotal?: string;
  liabilityPaymentTotal?: string;
};

type AccountRepository = {
  create(input: CreateAccountInput & { userId: string }): Promise<AccountRecord>;
  findByIdForUser(accountId: string, userId: string): Promise<AccountRecord | undefined>;
  listForUser(userId: string, options?: { includeArchived?: boolean }): Promise<AccountRecord[]>;
  updateMetadataForUser(accountId: string, userId: string, input: { name: string }): Promise<AccountRecord | undefined>;
  archiveForUser(accountId: string, userId: string, archivedAt: Date): Promise<AccountRecord | undefined>;
  getBalanceInputsForUser(userId: string, accountId?: string): Promise<BalanceInput[]>;
};

export type AccountView = AccountRecord & { balance: string };

function toAccountView(account: AccountRecord, balance?: BalanceInput): AccountView {
  const money = calculateAssetAccountBalance({
    currency: account.currencyCode,
    openingBalance: account.openingBalance,
    incomeTotal: balance?.incomeTotal ?? "0",
    expenseTotal: balance?.expenseTotal ?? "0",
    refundTotal: balance?.refundTotal ?? "0",
    adjustmentInTotal: balance?.adjustmentInTotal ?? "0",
    adjustmentOutTotal: balance?.adjustmentOutTotal ?? "0",
    transferInTotal: balance?.transferInTotal ?? "0",
    transferOutTotal: balance?.transferOutTotal ?? "0",
    liabilityPaymentTotal: balance?.liabilityPaymentTotal ?? "0",
  });
  return { ...account, balance: money.toString() };
}

function validateAccountValue(input: CreateAccountInput) {
  try {
    getCurrencyMetadata(input.currencyCode);
    parseLocalDate(input.openingDate);
    calculateAssetAccountBalance({
      currency: input.currencyCode,
      openingBalance: input.openingBalance,
      incomeTotal: "0",
      expenseTotal: "0",
    });
  } catch (error) {
    throw new ApplicationError("INVALID_INPUT", {
      field: error instanceof Error && error.message.includes("currency") ? "currencyCode" : "openingDate",
      cause: error,
    });
  }
}

export function createAccountService({
  accounts,
  gate = allowAllProductAccessGate,
}: {
  accounts: AccountRepository;
  gate?: ProductAccessGate;
}) {
  return {
    async createAccount(userId: string, input: CreateAccountInput) {
      await gate.assertCanWrite(userId);
      validateAccountValue(input);
      return accounts.create({ ...input, userId });
    },

    async listAccounts(userId: string, options: { includeArchived?: boolean } = {}): Promise<AccountView[]> {
      const [records, balances] = await Promise.all([
        accounts.listForUser(userId, options),
        accounts.getBalanceInputsForUser(userId),
      ]);
      const balancesById = new Map(balances.map((item) => [item.account.id, item]));
      return records.map((account) => toAccountView(account, balancesById.get(account.id)));
    },

    async getAccountOverview(userId: string, accountId: string): Promise<AccountView> {
      const account = await accounts.findByIdForUser(accountId, userId);
      if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND");
      const [balance] = await accounts.getBalanceInputsForUser(userId, accountId);
      return toAccountView(account, balance);
    },

    async updateAccountMetadata(userId: string, input: { accountId: string; name: string }) {
      const account = await accounts.findByIdForUser(input.accountId, userId);
      if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND");
      if (account.status === "ARCHIVED") throw new ApplicationError("ACCOUNT_ARCHIVED");
      const updated = await accounts.updateMetadataForUser(input.accountId, userId, { name: input.name });
      if (!updated) throw new ApplicationError("ACCOUNT_NOT_FOUND");
      return updated;
    },

    async archiveAccount(userId: string, accountId: string) {
      const account = await accounts.findByIdForUser(accountId, userId);
      if (!account) throw new ApplicationError("ACCOUNT_NOT_FOUND");
      if (account.status === "ARCHIVED") return account;
      const archived = await accounts.archiveForUser(accountId, userId, new Date());
      if (!archived) throw new ApplicationError("ACCOUNT_NOT_FOUND");
      return archived;
    },
  };
}
