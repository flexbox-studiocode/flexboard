import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ActivityPage from "./ActivityPage.jsx";
import ActivityList from "./ActivityList.jsx";

const router = (children) => (
  <MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    {children}
  </MemoryRouter>
);

describe("Activity alignment", () => {
  it("keeps updates and compact filters in one panel without sample history", async () => {
    render(router(<ActivityPage />));
    const panel = screen.getByRole("region", { name: "Update pekerjaan" });
    expect(
      within(panel).getByRole("heading", { name: "Riwayat belum tersedia" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByText("Data Contoh")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Anggota" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Proyek" })).toBeDisabled();
    expect(screen.getByLabelText("Dari tanggal")).toHaveAttribute(
      "type",
      "date",
    );
    expect(screen.getByLabelText("Sampai tanggal")).toHaveAttribute(
      "type",
      "date",
    );
    expect(screen.getByRole("button", { name: "Reset filter" })).toBeDisabled();
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Pencarian" }),
      "teks",
    );
    expect(screen.getByText(/Pilihan tersimpan di URL/)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("distinguishes unavailable and loaded empty history", () => {
    const { rerender } = render(<ActivityList />);
    expect(
      screen.getByRole("heading", { name: "Riwayat belum tersedia" }),
    ).toBeInTheDocument();
    rerender(<ActivityList entries={[]} />);
    expect(
      screen.getByRole("heading", { name: "Belum ada aktivitas" }),
    ).toBeInTheDocument();
  });

  it("renders supplied row content without inventing dates or project labels", () => {
    const { container } = render(
      router(
        <ActivityList
          entries={[
            {
              id: "provided",
              actorLabel: "Teks aktor",
              actionLabel: "Teks tindakan",
              objectLabel: "Teks objek",
              objectPath: "/tasks/provided",
              description: "Teks catatan",
            },
          ]}
        />,
      ),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Teks objek" })).toHaveAttribute(
      "href",
      "/tasks/provided",
    );
    expect(screen.getByText("Teks catatan")).toBeInTheDocument();
    expect(container.querySelector("time")).not.toBeInTheDocument();
    expect(
      container.querySelector(".activity-list__project"),
    ).not.toBeInTheDocument();
  });
});
