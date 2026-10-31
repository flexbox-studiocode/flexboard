import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { FilterToolbar } from "./FeatureUI.jsx";

const dateError =
  "Rentang tanggal tidak valid. Tanggal mulai harus sebelum atau sama dengan tanggal akhir.";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderToolbar(search = "", props = {}) {
  render(
    <MemoryRouter
      initialEntries={[`/tasks${search}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <FilterToolbar dates {...props} />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function currentParams() {
  return new URLSearchParams(screen.getByTestId("location").textContent);
}

function expectInvalidRange() {
  for (const label of ["Dari tanggal", "Sampai tanggal"]) {
    expect(screen.getByLabelText(label)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText(label)).toHaveAccessibleDescription(dateError);
  }
  expect(screen.getByRole("status")).toHaveTextContent(
    "Filter tidak valid. Pencarian dan filter tidak dijalankan.",
  );
}

function expectValidRange() {
  for (const label of ["Dari tanggal", "Sampai tanggal"]) {
    expect(screen.getByLabelText(label)).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText(label)).not.toHaveAccessibleDescription(
      dateError,
    );
  }
  expect(screen.getByRole("status")).not.toHaveTextContent(
    "Filter tidak valid.",
  );
}

describe("Validasi lokal rentang tanggal FilterToolbar", () => {
  it("mempertahankan rentang terbalik dari URL dan menghubungkan error ke kedua input", () => {
    renderToolbar("?from=2026-02-20&to=2026-02-10&view=list");

    expect(screen.getByLabelText("Dari tanggal")).toHaveValue("2026-02-20");
    expect(screen.getByLabelText("Sampai tanggal")).toHaveValue("2026-02-10");
    expectInvalidRange();
    expect(currentParams().get("from")).toBe("2026-02-20");
    expect(currentParams().get("to")).toBe("2026-02-10");
    expect(currentParams().get("view")).toBe("list");
  });

  it("memvalidasi perubahan kedua batas tanpa membuang nilai dan menerima tanggal yang sama", async () => {
    const user = userEvent.setup();
    renderToolbar("?from=2026-02-10&to=2026-02-20&view=list");
    const from = screen.getByLabelText("Dari tanggal");
    const to = screen.getByLabelText("Sampai tanggal");

    await user.click(from);
    fireEvent.change(from, { target: { value: "2026-02-21" } });
    expectInvalidRange();
    expect(from).toHaveValue("2026-02-21");
    expect(to).toHaveValue("2026-02-20");
    expect(currentParams().get("from")).toBe("2026-02-21");
    expect(currentParams().get("to")).toBe("2026-02-20");

    await user.click(to);
    fireEvent.change(to, { target: { value: "2026-02-21" } });
    expectValidRange();
    expect(currentParams().get("to")).toBe("2026-02-21");

    fireEvent.change(to, { target: { value: "2026-02-19" } });
    expectInvalidRange();
    expect(currentParams().get("to")).toBe("2026-02-19");

    fireEvent.change(from, { target: { value: "2026-02-18" } });
    expectValidRange();
    expect(currentParams().get("from")).toBe("2026-02-18");
    expect(currentParams().get("view")).toBe("list");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Pencarian dan filter belum dijalankan karena layanan data belum terhubung.",
    );
  });

  it("menghapus error saat salah satu batas dikosongkan", async () => {
    const user = userEvent.setup();
    renderToolbar("?from=2026-02-20&to=2026-02-10");

    await user.clear(screen.getByLabelText("Dari tanggal"));
    expectValidRange();
    expect(currentParams().has("from")).toBe(false);
    expect(currentParams().get("to")).toBe("2026-02-10");

    fireEvent.change(screen.getByLabelText("Dari tanggal"), {
      target: { value: "2026-02-20" },
    });
    expectInvalidRange();
    await user.clear(screen.getByLabelText("Sampai tanggal"));
    expectValidRange();
    expect(currentParams().get("from")).toBe("2026-02-20");
    expect(currentParams().has("to")).toBe(false);
  });

  it("mereset filter dan error tanpa menghapus parameter URL lain", async () => {
    const user = userEvent.setup();
    renderToolbar(
      "?from=2026-02-20&to=2026-02-10&q=teks&project=&member=&status=&priority=&view=list&view=compact&page=2",
    );
    expectInvalidRange();

    await user.click(screen.getByRole("button", { name: "Reset filter" }));

    expectValidRange();
    expect(screen.getByLabelText("Dari tanggal")).toHaveValue("");
    expect(screen.getByLabelText("Sampai tanggal")).toHaveValue("");
    expect(screen.getByLabelText("Pencarian")).toHaveValue("");
    expect([...currentParams().entries()]).toEqual([
      ["view", "list"],
      ["view", "compact"],
      ["page", "2"],
    ]);
    expect(screen.getByRole("button", { name: "Reset filter" })).toBeDisabled();
  });

  it.each(["teks", "2026-02-30", "2026-2-01"])(
    "menampilkan error untuk %s tanpa membuang URL dan dapat diperbaiki",
    (value) => {
      renderToolbar(`?from=${value}&to=2026-03-01&view=list`);
      const from = screen.getByLabelText("Dari tanggal");
      const to = screen.getByLabelText("Sampai tanggal");
      expect(from).toHaveValue("");
      expect(from).toHaveAttribute("aria-invalid", "true");
      expect(from).toHaveAccessibleDescription(
        expect.stringContaining("Tanggal pada URL tidak valid"),
      );
      expect(to).not.toHaveAttribute("aria-invalid");
      expect(to).not.toHaveAttribute("min");
      expect(currentParams().get("from")).toBe(value);
      expect(screen.getByRole("status")).toHaveTextContent(
        "Filter tidak valid.",
      );

      fireEvent.change(from, { target: { value: "2026-02-28" } });
      expectValidRange();
      expect(to).toHaveAttribute("min", "2026-02-28");
      expect(currentParams().get("from")).toBe("2026-02-28");
      expect(currentParams().get("view")).toBe("list");
    },
  );

  it("menandai parameter tanggal berulang dan menggantinya hanya saat pengguna memilih tanggal", () => {
    renderToolbar("?from=2026-01-01&from=2026-01-02&to=invalid&view=list");
    const from = screen.getByLabelText("Dari tanggal");
    expect(from).toHaveValue("");
    expect(from).toHaveAccessibleDescription(
      expect.stringContaining("Parameter tanggal berulang"),
    );
    expect(currentParams().getAll("from")).toEqual([
      "2026-01-01",
      "2026-01-02",
    ]);
    expect(screen.getByLabelText("Sampai tanggal")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    fireEvent.change(from, { target: { value: "2026-01-03" } });
    expect(from).not.toHaveAttribute("aria-invalid");
    expect(currentParams().getAll("from")).toEqual(["2026-01-03"]);
    expect(currentParams().get("to")).toBe("invalid");
    expect(screen.getByRole("status")).toHaveTextContent("Filter tidak valid.");
  });

  it("reset membersihkan tanggal malformed dan duplikat tetapi mempertahankan query lain", async () => {
    renderToolbar("?from=invalid&to=2026-02-30&to=&view=list");
    await userEvent.click(screen.getByRole("button", { name: "Reset filter" }));
    expectValidRange();
    expect([...currentParams()]).toEqual([["view", "list"]]);
    expect(screen.getByRole("button", { name: "Reset filter" })).toBeDisabled();
  });

  it("tidak memvalidasi rentang ketika input tanggal tidak ditampilkan", () => {
    renderToolbar("?from=2026-02-20&to=2026-02-10", { dates: false });

    expect(screen.queryByLabelText("Dari tanggal")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Sampai tanggal")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Filter tidak valid.",
    );
    expect(currentParams().get("from")).toBe("2026-02-20");
    expect(currentParams().get("to")).toBe("2026-02-10");
  });
});
