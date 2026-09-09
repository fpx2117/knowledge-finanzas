import { describe, expect, it } from "vitest";

import { paginate } from "../../apps/web/src/components/shared/pagination";

describe("paginate", () => {
  const items = Array.from({ length: 57 }, (_, i) => i);

  it("slices the current page and reports the page count", () => {
    expect(paginate(items, 1, 25)).toMatchObject({ page: 1, totalPages: 3, rows: items.slice(0, 25) });
    expect(paginate(items, 2, 25).rows).toEqual(items.slice(25, 50));
    expect(paginate(items, 3, 25).rows).toEqual(items.slice(50, 57));
  });

  it("clamps an out-of-range page into bounds", () => {
    expect(paginate(items, 99, 25).page).toBe(3);
    expect(paginate(items, 0, 25).page).toBe(1);
    expect(paginate(items, -5, 25).page).toBe(1);
  });

  it("an empty or single-page list is page 1 of 1", () => {
    expect(paginate([], 1, 25)).toMatchObject({ page: 1, totalPages: 1, rows: [] });
    expect(paginate([1, 2, 3], 1, 25)).toMatchObject({ page: 1, totalPages: 1 });
  });
});
