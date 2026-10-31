import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import DashboardPage from "./DashboardPage.jsx";

describe("Beranda mengikuti komposisi Figma tanpa data palsu", () => {
  it("menampilkan tugas bersama, tim, dan aktivitas, bukan statistik generik", () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Beranda", level: 1 }),
    ).toBeInTheDocument();
    const task = screen.getByRole("region", { name: "Tugas bersama" });
    expect(within(task).getByText("Akumulasi progres")).toBeInTheDocument();
    expect(task.querySelector("progress")).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Tim FlexBox" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Ringkasan aktivitas" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".feature-stats")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tambah tugas" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Lihat tugas" })).toHaveAttribute(
      "href",
      "/tasks",
    );
    expect(screen.queryByText("53%")).not.toBeInTheDocument();
  });
});
