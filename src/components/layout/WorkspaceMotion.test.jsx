import { expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../../App.jsx";

it("hanya mengganti boundary motion pada pathname tanpa mereset shell atau query input", () => {
  render(
    <MemoryRouter
      initialEntries={["/tasks"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>,
  );
  const main = screen.getByRole("main");
  const header = document.querySelector(".site-header");
  const banner = screen.getByRole("region", { name: "Selamat datang" });
  const entry = document.querySelector(".motion-route");
  const search = screen.getByLabelText("Pencarian", { exact: true });
  fireEvent.change(search, { target: { value: "lokal" } });
  expect(document.querySelector(".motion-route")).toBe(entry);
  expect(search).toHaveValue("lokal");
  expect(search).toBeInTheDocument();
  fireEvent.focus(search);
  expect(entry).toHaveAttribute("data-motion-settled", "true");
  fireEvent.blur(search);
  expect(entry).toHaveAttribute("data-motion-settled", "true");
  fireEvent.click(
    screen.getByRole("link", { name: "Progres Tim", exact: true }),
  );
  expect(document.querySelector(".motion-route")).not.toBe(entry);
  expect(entry).not.toBeInTheDocument();
  expect(screen.getByRole("main")).toBe(main);
  expect(document.querySelector(".site-header")).toBe(header);
  expect(screen.getByRole("region", { name: "Selamat datang" })).toBe(banner);
  expect(main).toHaveFocus();
  expect(document.querySelectorAll(".motion-route")).toHaveLength(1);
});
