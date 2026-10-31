import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemberCard from "./MemberCard.jsx";
import { MemoryRouter } from "react-router-dom";
import MembersPage from "./MembersPage.jsx";
import AddMemberDialog from "./AddMemberDialog.jsx";
import EditMemberDialog from "./EditMemberDialog.jsx";

// The Members page reads the live API. We stub fetch so no real network happens in unit tests.
const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Members page alignment", () => {
  it("fails closed with an unavailable state when the API rejects, never fabricating counts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(403, { error: { code: "FORBIDDEN" } })),
    );
    const { container } = render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MembersPage />
      </MemoryRouter>,
    );
    const panel = screen.getByRole("region", { name: "Daftar anggota" });
    expect(
      await within(panel).findByRole("heading", {
        name: "Daftar anggota gagal dimuat",
      }),
    ).toBeInTheDocument();
    expect(container.querySelector(".feature-metric")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

// Generic presentation values only. No account fixtures or API substitutes.
describe("MemberCard", () => {
  it("keeps absent measurements unavailable rather than inventing zero", () => {
    render(<MemberCard />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("—");
    expect(
      screen.getByText("Tugas aktif").nextElementSibling,
    ).toHaveTextContent("—");
    expect(
      screen.getByText("Status akun").nextElementSibling,
    ).toHaveTextContent("—");
    expect(screen.getByText("Belum tersedia")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders caller-provided text without deriving roles or status", () => {
    render(
      <MemberCard
        name="Teks judul"
        roleLabel="Teks peran"
        statusLabel="Teks status"
        activeTaskCount={0}
        progress={0}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Teks judul" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Teks peran")).toBeInTheDocument();
    expect(screen.getByText("Teks status")).toBeInTheDocument();
    expect(
      screen.getByText("Tugas aktif").nextElementSibling,
    ).toHaveTextContent("0");
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "0");
  });

  it("renders role badge and per-target management actions from permissions", async () => {
    const onEdit = vi.fn(() => {});
    const onDeactivate = vi.fn(() => {});
    render(
      <MemberCard
        id="m1"
        name="Kiandra"
        role="member"
        jobTitle="Backend Developer"
        is_active
        activeTaskCount={3}
        progress={60}
        permissions={{ edit: true, deactivate: true }}
        onEdit={onEdit}
        onDeactivate={onDeactivate}
      />,
    );
    expect(screen.getByText("Member")).toBeInTheDocument();
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(
      screen.getByText("Tugas aktif").nextElementSibling,
    ).toHaveTextContent("3");
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith("m1");
    await userEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }));
    expect(onDeactivate).toHaveBeenCalledWith("m1");
  });

  it("does not display invalid measurements as facts", () => {
    const { rerender } = render(
      <MemberCard activeTaskCount={-1} progress={101} />,
    );
    expect(
      screen.getByText("Tugas aktif").nextElementSibling,
    ).toHaveTextContent("—");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    rerender(<MemberCard activeTaskCount={1.5} progress={Number.NaN} />);
    expect(
      screen.getByText("Tugas aktif").nextElementSibling,
    ).toHaveTextContent("—");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});

describe("AddMemberDialog", () => {
  it("blocks submit when passwords mismatch and shows a clear error without calling the API", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(
      <MemoryRouter>
        <AddMemberDialog open onClose={() => {}} />
      </MemoryRouter>,
    );
    await userEvent.type(
      screen.getByLabelText("Nama tampilan"),
      "Anggota Baru",
    );
    await userEvent.type(screen.getByLabelText("Email"), "baru@example.test");
    await userEvent.type(screen.getByLabelText("Password awal"), "rahasia123");
    await userEvent.type(
      screen.getByLabelText("Konfirmasi password awal"),
      "beda12345",
    );
    await userEvent.click(screen.getByRole("button", { name: "Buat akun" }));
    expect(
      await screen.findByRole("heading", {
        name: "Konfirmasi password tidak cocok.",
      }),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("only offers the admin role when the actor may create admins", () => {
    render(
      <MemoryRouter>
        <AddMemberDialog open onClose={() => {}} canCreateAdmin={false} />
      </MemoryRouter>,
    );
    const role = screen.getByLabelText("Role");
    expect(
      within(role).queryByRole("option", { name: "Admin" }),
    ).not.toBeInTheDocument();
  });

  it("creates the member through the API and never echoes a password back", async () => {
    const fetchSpy = vi.fn(async () =>
      jsonResponse(201, {
        data: {
          member: { id: "new", display_name: "Anggota Baru", role: "member" },
        },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const onCreated = vi.fn();
    render(
      <MemoryRouter>
        <AddMemberDialog open onClose={() => {}} onCreated={onCreated} />
      </MemoryRouter>,
    );
    await userEvent.type(
      screen.getByLabelText("Nama tampilan"),
      "Anggota Baru",
    );
    await userEvent.type(screen.getByLabelText("Email"), "baru@example.test");
    await userEvent.type(screen.getByLabelText("Password awal"), "rahasia123");
    await userEvent.type(
      screen.getByLabelText("Konfirmasi password awal"),
      "rahasia123",
    );
    await userEvent.click(screen.getByRole("button", { name: "Buat akun" }));
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/members",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    const [, init] = fetchSpy.mock.calls[0];
    const sent = JSON.parse(init.body);
    expect(sent).toMatchObject({
      displayName: "Anggota Baru",
      email: "baru@example.test",
      role: "member",
    });
    expect(await screen.findByText(/berhasil dibuat/)).toBeInTheDocument();
    // The success screen must warn that the password is not shown again.
    expect(
      screen.getByText(/Password tidak ditampilkan di sini/),
    ).toBeInTheDocument();
    expect(onCreated).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe("EditMemberDialog", () => {
  it("sends only the changed fields and includes role when the actor may change roles", async () => {
    const fetchSpy = vi.fn(async () =>
      jsonResponse(200, { data: { member: { id: "m1", role: "admin" } } }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const member = {
      id: "m1",
      display_name: "Kiandra",
      job_title: "Backend",
      role: "member",
      email: "k@example.test",
    };
    render(
      <MemoryRouter>
        <EditMemberDialog
          open
          onClose={() => {}}
          member={member}
          canChangeRole
        />
      </MemoryRouter>,
    );
    await userEvent.clear(screen.getByLabelText("Job title"));
    await userEvent.type(screen.getByLabelText("Job title"), "Lead Backend");
    await userEvent.selectOptions(screen.getByLabelText("Role"), "admin");
    await userEvent.click(
      screen.getByRole("button", { name: "Simpan perubahan" }),
    );
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      jobTitle: "Lead Backend",
      role: "admin",
    });
    vi.unstubAllGlobals();
  });

  it("keeps email read-only and hides the role selector when role changes are not permitted", () => {
    const member = {
      id: "m1",
      display_name: "Kiandra",
      role: "member",
      email: "k@example.test",
    };
    render(
      <MemoryRouter>
        <EditMemberDialog
          open
          onClose={() => {}}
          member={member}
          canChangeRole={false}
        />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.queryByLabelText("Role")).not.toBeInTheDocument();
  });
});
