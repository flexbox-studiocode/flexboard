import { useState } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectForm from "./ProjectForm.jsx";
import {
  createProject,
  listMembers,
  listProjectMembers,
  updateProject,
  updateProjectMembers,
} from "../tasks/taskApi.js";

vi.mock("../tasks/taskApi.js", () => ({
  createProject: vi.fn(),
  listMembers: vi.fn(),
  listProjectMembers: vi.fn(),
  updateProject: vi.fn(),
  updateProjectMembers: vi.fn(),
}));

// Exercise the same mount/key lifecycle as ProjectDialog without mocking native dialogs.
function FormLifecycle({ initialMode = "new" }) {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState(initialMode);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Buka form
      </button>
      <button type="button" onClick={() => setMode("edit")}>
        Buka edit
      </button>
      <button type="button" onClick={() => setMode("new")}>
        Buka baru
      </button>
      {open && (
        <ProjectForm
          key={mode}
          mode={mode}
          project={
            mode === "edit"
              ? {
                  id: "project-1",
                  name: "Proyek lama",
                  category: "startup_sme",
                }
              : null
          }
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  listMembers.mockResolvedValue({
    members: [
      {
        id: "member-1",
        display_name: "Kiandra",
        job_title: "Backend",
        role: "member",
        is_active: true,
      },
      {
        id: "member-2",
        display_name: "Rainer",
        job_title: "Frontend",
        role: "member",
        is_active: true,
      },
      {
        id: "member-3",
        display_name: "Fakhri",
        job_title: "UI/UX",
        role: "member",
        is_active: true,
      },
      {
        id: "member-4",
        display_name: "Mantan Anggota",
        role: "member",
        is_active: false,
      },
      {
        id: "leader-1",
        display_name: "Pemimpin",
        role: "leader",
        is_active: true,
      },
    ],
  });
  listProjectMembers.mockResolvedValue({
    members: [
      { id: "member-1", project_role: "member" },
      { id: "leader-1", project_role: "lead" },
    ],
  });
  createProject.mockResolvedValue({ project: { id: "project-1" } });
  updateProject.mockResolvedValue({ project: { id: "project-1" } });
  updateProjectMembers.mockResolvedValue({ memberIds: [] });
});
afterEach(cleanup);

it("menampilkan field nama, deskripsi, kategori, dan tombol simpan/batal", async () => {
  render(<FormLifecycle />);
  const user = userEvent.setup();
  expect(screen.getByLabelText("Nama proyek")).toHaveValue("");
  expect(screen.getByLabelText("Deskripsi proyek")).toHaveValue("");
  await user.type(
    screen.getByLabelText("Nama proyek"),
    "Website Company Profile",
  );
  await user.type(
    screen.getByLabelText("Deskripsi proyek"),
    "Profil perusahaan",
  );
  expect(screen.getByLabelText("Nama proyek")).toHaveValue(
    "Website Company Profile",
  );
  expect(screen.getByLabelText("Deskripsi proyek")).toHaveValue(
    "Profil perusahaan",
  );
  expect(screen.getByRole("button", { name: "Simpan proyek" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Batal" })).toBeEnabled();
});

it("menyediakan empat kategori proyek dengan nilai internal yang tersimpan", async () => {
  render(<FormLifecycle />);
  const category = await screen.findByLabelText("Kategori proyek");
  const options = screen
    .getAllByRole("option")
    .filter((option) => option.closest("#project-category"));
  expect(options.map((option) => option.getAttribute("value"))).toEqual([
    "corporate_enterprise",
    "startup_sme",
    "government_public",
    "educational_community",
  ]);
  expect(category).toHaveValue("corporate_enterprise");
});

it("memuat anggota aktif sebagai tombol pilihan dan mengecualikan anggota nonaktif serta leader", async () => {
  render(<FormLifecycle />);
  const fieldset = await screen.findByRole("group", { name: "Anggota proyek" });
  const buttons = within(fieldset).getAllByRole("button");
  const names = buttons.map((button) =>
    button.textContent.replace(/\s*✓\s*$/, "").trim(),
  );
  const withoutJob = names.map((name) => name.split(" · ")[0]);
  expect(withoutJob).toEqual(["Kiandra", "Rainer", "Fakhri"]);
  expect(
    within(fieldset).queryByText(/Mantan Anggota/),
  ).not.toBeInTheDocument();
  expect(within(fieldset).queryByText(/Pemimpin/)).not.toBeInTheDocument();
});

it("menambah dan menghapus chip anggota, tanpa duplikat, lalu mengirim ID profil terpilih", async () => {
  const user = userEvent.setup();
  render(<FormLifecycle />);
  const fieldset = await screen.findByRole("group", { name: "Anggota proyek" });
  await user.type(
    screen.getByLabelText("Nama proyek"),
    "Website Company Profile FlexBox",
  );
  await user.type(
    screen.getByLabelText("Deskripsi proyek"),
    "Situs profil perusahaan",
  );

  // Select all three via the toggle buttons.
  for (const name of ["Kiandra", "Rainer", "Fakhri"]) {
    await user.click(
      within(fieldset).getByRole("button", { name: new RegExp(`^${name}`) }),
    );
  }
  // Chips show each selected member with a remove control; count is three.
  const chips = within(fieldset).getAllByRole("button", { name: /Keluarkan/ });
  expect(chips).toHaveLength(3);
  // Clicking a selected member toggles it off (no duplicates are ever created).
  await user.click(within(fieldset).getByRole("button", { name: /^Rainer/ }));
  expect(
    within(fieldset).getAllByRole("button", { name: /Keluarkan/ }),
  ).toHaveLength(2);
  // Re-add Rainer — still unique.
  await user.click(within(fieldset).getByRole("button", { name: /^Rainer/ }));
  expect(
    within(fieldset).getAllByRole("button", { name: /Keluarkan/ }),
  ).toHaveLength(3);

  await user.click(screen.getByRole("button", { name: "Simpan proyek" }));
  await waitFor(() => expect(createProject).toHaveBeenCalledTimes(1));
  expect(createProject).toHaveBeenCalledWith({
    name: "Website Company Profile FlexBox",
    description: "Situs profil perusahaan",
    category: "corporate_enterprise",
    memberIds: expect.arrayContaining(["member-1", "member-2", "member-3"]),
  });
  expect(createProject.mock.calls[0][0].memberIds).toHaveLength(3);
});

it("menolak menyimpan proyek tanpa nama", async () => {
  const user = userEvent.setup();
  render(<FormLifecycle />);
  await screen.findByRole("group", { name: "Anggota proyek" });
  await user.click(screen.getByRole("button", { name: "Simpan proyek" }));
  expect(screen.getByLabelText("Nama proyek")).toBeInvalid();
  expect(screen.getByLabelText("Nama proyek")).toBeRequired();
  expect(createProject).not.toHaveBeenCalled();
});

it("menampilkan pesan server saat izin ditolak", async () => {
  createProject.mockRejectedValue(new Error("HTTP_403"));
  const user = userEvent.setup();
  render(<FormLifecycle />);
  await screen.findByRole("group", { name: "Anggota proyek" });
  await user.type(screen.getByLabelText("Nama proyek"), "Proyek terbatas");
  await user.click(screen.getByRole("button", { name: "Simpan proyek" }));
  expect(
    await screen.findByRole("heading", { name: "Anda tidak memiliki izin." }),
  ).toBeInTheDocument();
});

it("membuang input saat ditutup dan dibuka kembali", async () => {
  const user = userEvent.setup();
  render(<FormLifecycle />);
  await screen.findByRole("group", { name: "Anggota proyek" });
  await user.type(screen.getByLabelText("Nama proyek"), "Input pengguna");
  await user.type(screen.getByLabelText("Deskripsi proyek"), "Catatan lokal");
  await user.click(screen.getByRole("button", { name: "Batal" }));
  expect(screen.queryByLabelText("Nama proyek")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Buka form" }));
  expect(screen.getByLabelText("Nama proyek")).toHaveValue("");
  expect(screen.getByLabelText("Deskripsi proyek")).toHaveValue("");
});

it("mengosongkan rancangan saat mode berubah", async () => {
  const user = userEvent.setup();
  render(<FormLifecycle />);
  await screen.findByRole("group", { name: "Anggota proyek" });
  await user.type(screen.getByLabelText("Nama proyek"), "Input pengguna");
  await user.type(screen.getByLabelText("Deskripsi proyek"), "Catatan lokal");
  await user.click(screen.getByRole("button", { name: "Buka edit" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Nama proyek")).toHaveValue("Proyek lama"),
  );
  await user.click(screen.getByRole("button", { name: "Buka baru" }));
  expect(screen.getByLabelText("Nama proyek")).toHaveValue("");
  expect(screen.getByLabelText("Deskripsi proyek")).toHaveValue("");
});

it("mode edit memuat anggota proyek yang sudah ada dan menyimpan perubahan beserta membership", async () => {
  const user = userEvent.setup();
  render(<FormLifecycle initialMode="edit" />);
  const fieldset = await screen.findByRole("group", { name: "Anggota proyek" });
  // Member-1 is prefilled from listProjectMembers (leader row excluded from selectable list).
  await waitFor(() =>
    expect(
      within(fieldset).getAllByRole("button", { name: /Keluarkan/ }),
    ).toHaveLength(1),
  );
  await user.click(within(fieldset).getByRole("button", { name: /Fakhri/ }));
  await user.click(screen.getByRole("button", { name: "Simpan proyek" }));
  await waitFor(() =>
    expect(updateProject).toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({ name: "Proyek lama", category: "startup_sme" }),
    ),
  );
  expect(updateProjectMembers).toHaveBeenCalledWith("project-1", [
    "member-1",
    "member-3",
  ]);
});
