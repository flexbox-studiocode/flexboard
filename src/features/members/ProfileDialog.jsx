import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Modal, UnavailableState, Input } from "../../components/ui/index.js";
import "./profile.css";

async function patchProfile(displayName, jobTitle) {
  const response = await fetch("/api/auth/me", {
    method: "PATCH",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName, jobTitle }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error?.message || `HTTP_${response.status}`);
  }
  const body = await response.json();
  return body?.data;
}

export default function ProfileDialog({ open, onClose, auth }) {
  const profile = auth?.profile;
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function startEdit() {
    setDisplayName(profile?.displayName || "");
    setJobTitle(profile?.jobTitle || "");
    setError(null);
    setEditing(true);
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Nama tampilan wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await patchProfile(displayName.trim(), jobTitle.trim() || null);
      await auth.refresh();
      setEditing(false);
    } catch (err) {
      setError(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Profil akun"
      className="profile-dialog"
    >
      {auth?.status !== "authenticated" && (
        <UnavailableState
          title={
            auth?.status === "unavailable"
              ? "Sesi tidak tersedia"
              : "Belum masuk"
          }
          description={
            auth?.status === "unavailable"
              ? "Layanan autentikasi tidak tersedia. Coba lagi nanti."
              : "Tidak ada sesi tervalidasi."
          }
        />
      )}
      {editing ? (
        <form className="profile-form" onSubmit={saveEdit}>
          <Input
            label="Nama tampilan"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={saving}
            required
          />
          <Input
            label="Jabatan"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            disabled={saving}
          />
          {error && <p role="alert" className="profile-error">{error}</p>}
          <div className="profile-form-actions">
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
            <Button type="button" variant="secondary" disabled={saving} onClick={() => setEditing(false)}>
              Batal
            </Button>
          </div>
        </form>
      ) : (
        <>
          <dl className="profile-details">
            <div>
              <dt>Nama tampilan</dt>
              <dd>{profile?.displayName || profile?.email || "—"}</dd>
            </div>
            <div>
              <dt>Jabatan</dt>
              <dd>{profile?.jobTitle || "—"}</dd>
            </div>
            <div>
              <dt>Role akses</dt>
              <dd>{profile?.role || "—"}</dd>
            </div>
            <div>
              <dt>Status akun</dt>
              <dd>{profile ? "Aktif" : "—"}</dd>
            </div>
            <div>
              <dt>Tugas aktif</dt>
              <dd>—</dd>
            </div>
            <div>
              <dt>Progres pribadi</dt>
              <dd>—</dd>
            </div>
          </dl>
          <p className="profile-disclosure" id="profile-permissions">
            <LockKeyhole size={16} aria-hidden="true" />
            Perubahan profil, role, status, dan logout memerlukan sesi serta izin
            server.
          </p>
          <div className="profile-actions" aria-describedby="profile-permissions">
            <Button
              variant="secondary"
              disabled={auth?.status !== "authenticated"}
              onClick={startEdit}
            >
              Ubah profil
            </Button>
            <Button variant="secondary" disabled>
              Kelola role/status
            </Button>
            <Button
              variant="secondary"
              disabled={auth?.status !== "authenticated"}
              onClick={async () => {
                await auth.logout();
                onClose();
              }}
            >
              Keluar
            </Button>
            <Link to="/login" className="button button--primary" onClick={onClose}>
              Halaman masuk
            </Link>
          </div>
        </>
      )}
    </Modal>
  );
}
