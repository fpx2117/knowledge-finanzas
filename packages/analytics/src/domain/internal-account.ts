// Excludes this repo's own seed/E2E accounts (every one of them uses an `@*.test` address — RFC
// 2606's reserved test TLD) from MVP KPIs by default, plus any configured staff domain
// (`internalEmailDomains`), without needing a dedicated "is this user internal" column anywhere.
export function isInternalAccountEmail(email: string, internalEmailDomains: string[] = []): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  if (domain.endsWith(".test")) return true;
  return internalEmailDomains.some((allowed) => domain === allowed.toLowerCase());
}
