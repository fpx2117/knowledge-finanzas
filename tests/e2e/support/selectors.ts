import type { Page } from "@playwright/test";

export async function chooseCombobox(page: Page, label: string, option: string) {
  await page.getByLabel(label).click();
  const accessibleOption = option.replace(/\s·\s/g, " ");
  await page.getByRole("option", { name: accessibleOption, exact: false }).click();
}
