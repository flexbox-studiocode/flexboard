import { describe, expect, it } from "vitest";
import { readDateFilter } from "./dateFilters.js";

function parse(value) {
  return readDateFilter(new URLSearchParams({ from: value }), "from");
}

describe("tanggal kalender lokal dari URL", () => {
  it.each([
    "2026-01-01",
    "2026-04-30",
    "2024-02-29",
    "2000-02-29",
    "0001-01-01",
    "9999-12-31",
  ])("menerima %s tanpa parsing timezone", (value) => {
    expect(parse(value)).toEqual({ value, error: undefined });
  });

  it.each([
    "2026-02-29",
    "1900-02-29",
    "2026-04-31",
    "2026-00-01",
    "2026-13-01",
    "2026-01-00",
    "0000-01-01",
    "2026-2-03",
    "2026-02-3",
    "2026-01-01T00:00:00Z",
    "teks",
    " 2026-01-01",
    "10000-01-01",
  ])("menolak %s tanpa normalisasi diam-diam", (value) => {
    expect(parse(value)).toEqual({
      value: "",
      error: expect.stringContaining("Tanggal pada URL tidak valid"),
    });
  });

  it("menerima batas yang tidak diisi", () => {
    expect(parse("")).toEqual({ value: "", error: undefined });
    expect(readDateFilter(new URLSearchParams(), "from")).toEqual({
      value: "",
      error: undefined,
    });
  });

  it("menolak parameter berulang meskipun nilainya sama atau kosong", () => {
    for (const search of [
      "from=2026-01-01&from=2026-01-01",
      "from=&from=2026-01-01",
      "from=&from=",
    ]) {
      const params = new URLSearchParams(search);
      expect(readDateFilter(params, "from")).toEqual({
        value: "",
        error: expect.stringContaining("Parameter tanggal berulang"),
      });
      expect(params.toString()).toBe(search);
    }
  });
});
