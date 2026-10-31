import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  Select,
  UnavailableState,
} from "../../components/ui/index.js";
import { createMember } from "./memberApi.js";
import "./members.css";

const errorText = (message) => {
  if (message === "HTTP_409") return "Email sudah digunakan akun lain.";
  if (message === "HTTP_403")
    return "Anda tidak memiliki izin menambah anggota.";
  if (message === "HTTP_400") return "Periksa kembali data yang diisi.";
  return "Anggota gagal ditambahkan.";
};

export default function AddMemberDialog({
  open,
  onClose,
  onCreated,
  canCreateAdmin = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title="Tambah anggota">
      {open && (
        <AddMemberForm
          onClose={onClose}
          onCreated={onCreated}
          canCreateAdmin={canCreateAdmin}
        />
      )}
    </Modal>
  );
}

function AddMemberForm({ onClose, onCreated, canCreateAdmin }) {
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    jobTitle: "",
    role: "member",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const update = (e) =>
    setForm((x) => ({ ...x, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8)
      return setError("Password minimal 8 karakter.");
    if (form.password !== form.passwordConfirm)
      return setError("Konfirmasi password tidak cocok.");
    setSaving(true);
    try {
      const result = await createMember({
        displayName: form.displayName,
        email: form.email,
        jobTitle: form.jobTitle,
        role: form.role,
        password: form.password,
        passwordConfirm: form.passwordConfirm,
      });
      setCreated(result?.member || result);
      onCreated?.(result?.member || result);
    } catch (err) {
      setError(errorText(err.message));
    } finally {
      setSaving(false);
    }
  }

  if (created)
    return (
      <div className="add-member-success">
        <p role="status">
          Akun <strong>{created.display_name || form.displayName}</strong>{" "}
          berhasil dibuat sebagai {created.role || form.role}.
        </p>
        <p className="feature-note">
          Sampaikan email dan password awal kepada anggota melalui jalur aman.
          Password tidak ditampilkan di sini dan tidak dapat dilihat kembali.
        </p>
        <div className="account-management-actions">
          <Button onClick={onClose}>Selesai</Button>
        </div>
      </div>
    );

  return (
    <form className="project-dialog-form" onSubmit={submit}>
      {error && <UnavailableState title={error} />}
      <Input
        label="Nama tampilan"
        name="displayName"
        value={form.displayName}
        onChange={update}
        required
        autoComplete="off"
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={update}
        required
        autoComplete="off"
      />
      <Input
        label="Job title"
        name="jobTitle"
        value={form.jobTitle}
        onChange={update}
        placeholder="Contoh: Backend Developer"
        autoComplete="off"
      />
      <Select label="Role" name="role" value={form.role} onChange={update}>
        <option value="member">Member</option>
        {canCreateAdmin && <option value="admin">Admin</option>}
      </Select>
      <Input
        label="Password awal"
        name="password"
        type="password"
        value={form.password}
        onChange={update}
        required
        minLength={8}
        autoComplete="new-password"
        hint="Minimal 8 karakter. Bagikan kepada anggota melalui jalur aman."
      />
      <Input
        label="Konfirmasi password awal"
        name="passwordConfirm"
        type="password"
        value={form.passwordConfirm}
        onChange={update}
        required
        autoComplete="new-password"
      />
      <div className="project-dialog-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : "Buat akun"}
        </Button>
      </div>
    </form>
  );
}
