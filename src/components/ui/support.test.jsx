import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Feedback } from "./Feedback.jsx";
import { Pagination } from "./Pagination.jsx";

function PaginationExample({
  initialPage = 1,
  pageCount = 3,
  disabled = false,
}) {
  const [page, setPage] = useState(initialPage);
  const [changes, setChanges] = useState([]);
  return (
    <>
      <Pagination
        page={page}
        pageCount={pageCount}
        disabled={disabled}
        onPageChange={(value) => {
          setPage(value);
          setChanges((previous) => [...previous, value]);
        }}
      />
      <p data-testid="changes">{JSON.stringify(changes)}</p>
    </>
  );
}

describe("Feedback", () => {
  it.each([
    ["info", "status"],
    ["success", "status"],
    ["error", "alert"],
  ])("menampilkan nada %s dengan peran %s", (tone, role) => {
    render(
      <Feedback tone={tone} title="Pemberitahuan">
        Keterangan lokal.
      </Feedback>,
    );
    const feedback = screen.getByRole(role, { name: "Pemberitahuan" });
    expect(feedback).toHaveClass(`feedback--${tone}`);
    expect(within(feedback).getByText("Keterangan lokal.")).toBeInTheDocument();
    expect(within(feedback).queryByRole("button")).not.toBeInTheDocument();
  });

  it("menggunakan info secara bawaan dan mendukung isi tanpa judul", () => {
    render(<Feedback>{0}</Feedback>);
    expect(screen.getByRole("status")).toHaveClass("feedback--info");
    expect(screen.getByRole("status")).toHaveTextContent("0");
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("menutup melalui tombol berlabel menggunakan keyboard", async () => {
    function Example() {
      const [visible, setVisible] = useState(true);
      return visible ? (
        <Feedback title="Informasi" onDismiss={() => setVisible(false)}>
          Keterangan.
        </Feedback>
      ) : (
        <p>Ditutup</p>
      );
    }
    const user = userEvent.setup();
    render(<Example />);
    const dismiss = screen.getByRole("button", { name: "Tutup pemberitahuan" });
    expect(dismiss).toHaveAttribute("type", "button");
    await user.tab();
    expect(dismiss).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Ditutup")).toBeInTheDocument();
  });
});

describe("Pagination tanpa kontrak API atau data domain", () => {
  it("menampilkan nomor saat ini, total dan label navigasi", () => {
    render(
      <Pagination
        page={2}
        pageCount={4}
        label="Navigasi contoh"
        onPageChange={() => {}}
      />,
    );
    const navigation = screen.getByRole("navigation", {
      name: "Navigasi contoh",
    });
    expect(navigation).toHaveTextContent("Halaman 2 dari 4");
    expect(within(navigation).getByText("2")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(navigation).getByRole("button", { name: "Sebelumnya" }),
    ).toHaveAttribute("type", "button");
    expect(
      within(navigation).getByRole("button", { name: "Berikutnya" }),
    ).toHaveAttribute("type", "button");
  });

  it("mendukung Enter dan Space serta menjaga batas halaman", async () => {
    const user = userEvent.setup();
    render(<PaginationExample />);
    const previous = screen.getByRole("button", { name: "Sebelumnya" });
    const next = screen.getByRole("button", { name: "Berikutnya" });
    expect(previous).toBeDisabled();
    await user.click(previous);
    expect(screen.getByTestId("changes")).toHaveTextContent("[]");
    await user.tab();
    expect(next).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("navigation")).toHaveTextContent(
      "Halaman 2 dari 3",
    );
    await user.keyboard(" ");
    expect(screen.getByRole("navigation")).toHaveTextContent(
      "Halaman 3 dari 3",
    );
    expect(next).toBeDisabled();
    await user.click(next);
    expect(screen.getByTestId("changes")).toHaveTextContent("[2,3]");
    previous.focus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("navigation")).toHaveTextContent(
      "Halaman 1 dari 3",
    );
    expect(previous).toBeDisabled();
    expect(screen.getByTestId("changes")).toHaveTextContent("[2,3,2,1]");
  });

  it("tidak memanggil perubahan ketika dinonaktifkan", async () => {
    const user = userEvent.setup();
    render(<PaginationExample initialPage={2} disabled />);
    const previous = screen.getByRole("button", { name: "Sebelumnya" });
    const next = screen.getByRole("button", { name: "Berikutnya" });
    expect(previous).toBeDisabled();
    expect(next).toBeDisabled();
    await user.click(previous);
    await user.click(next);
    await user.tab();
    expect(previous).not.toHaveFocus();
    expect(next).not.toHaveFocus();
    await user.keyboard("{Enter} ");
    expect(screen.getByTestId("changes")).toHaveTextContent("[]");
    expect(screen.getByRole("navigation")).toHaveTextContent(
      "Halaman 2 dari 3",
    );
  });

  it("menonaktifkan kedua kontrol untuk satu halaman atau callback yang tidak tersedia", () => {
    const { rerender } = render(<PaginationExample pageCount={1} />);
    expect(
      screen.getAllByRole("button").every((button) => button.disabled),
    ).toBe(true);
    rerender(<Pagination page={2} pageCount={3} />);
    expect(
      screen.getAllByRole("button").every((button) => button.disabled),
    ).toBe(true);
  });

  it.each([
    [1, 0],
    [0, 0],
    [0, 3],
    [-1, 3],
    [4, 3],
    [1.5, 3],
    [NaN, 3],
    [Infinity, 3],
    ["1", 3],
    [undefined, 3],
    [null, 3],
    [1, -1],
    [1, 2.5],
    [1, NaN],
    [1, Infinity],
    [1, "3"],
    [1, undefined],
    [1, null],
    [1, Number.MAX_SAFE_INTEGER + 1],
    [Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 1],
  ])(
    "tidak merender metadata tidak valid page=%s pageCount=%s",
    (page, pageCount) => {
      const { container } = render(
        <Pagination page={page} pageCount={pageCount} />,
      );
      expect(container).toBeEmptyDOMElement();
    },
  );
});
