import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import {
  createProject,
  listMembers,
  listProjectMembers,
  updateProject,
  updateProjectMembers,
} from "../tasks/taskApi.js";
import {
  Button,
  Input,
  Textarea,
  UnavailableState,
} from "../../components/ui/index.js";
import "./projects.css";

const categories = [
  ["corporate_enterprise", "Corporate & Enterprise"],
  ["startup_sme", "Startup & SME (UMKM)"],
  ["government_public", "Government & Public Sector"],
  ["educational_community", "Educational & Community"],
];

/** Project creation/edit form backed by the project API. */
export default function ProjectForm({
  mode = "new",
  project = null,
  onClose,
  onSaved,
}) {
  const editing = mode === "edit" && project;
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [category, setCategory] = useState(
    project?.category || "corporate_enterprise",
  );
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const noteId = useId();
  useEffect(() => {
    listMembers()
      .then((data) => setMembers(data?.members || []))
      .catch(() => setError("Daftar anggota gagal dimuat."));
  }, []);
  useEffect(() => {
    if (!editing) return;
    listProjectMembers(project.id)
      .then((data) =>
        setSelected(
          (data?.members || [])
            .filter((m) => m.project_role === "member")
            .map((m) => m.id),
        ),
      )
      .catch(() => setError("Anggota proyek gagal dimuat."));
  }, [editing, project?.id]);
  const selectable = members.filter(
    (m) => m.is_active !== false && m.role !== "leader",
  );
  const chosen = selected
    .map((id) => selectable.find((m) => m.id === id))
    .filter(Boolean);
  function toggle(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }
  async function submit(event) {
    event.preventDefault();
    if (!name.trim()) return setError("Nama proyek wajib diisi.");
    setSaving(true);
    setError("");
    try {
      let result;
      if (editing) {
        result = await updateProject(project.id, {
          name,
          description,
          category,
        });
        await updateProjectMembers(project.id, selected);
      } else {
        result = await createProject({
          name,
          description,
          category,
          memberIds: selected,
        });
      }
      onSaved?.(result);
      onClose?.();
    } catch (e) {
      setError(
        e.message === "HTTP_403"
          ? "Anda tidak memiliki izin."
          : "Proyek gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      className="project-dialog-form"
      aria-describedby={noteId}
      onSubmit={submit}
    >
      <p className="feature-note" id={noteId}>
        Pilih anggota aktif yang benar-benar bergabung dalam proyek. Anda
        otomatis menjadi project lead.
      </p>
      {error && <UnavailableState title={error} />}
      <Input
        label="Nama proyek"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Tuliskan nama proyek"
        autoComplete="off"
        required
      />
      <Textarea
        label="Deskripsi proyek"
        name="description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={4}
        placeholder="Jelaskan tujuan dan ruang lingkup proyek"
      />
      <div className="field">
        <label htmlFor="project-category">Kategori proyek</label>
        <select
          id="project-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="project-members-field">
        <legend>Anggota proyek</legend>
        <div className="project-members-chips">
          {chosen.map((member) => (
            <span key={member.id} className="project-member-chip">
              {member.display_name || member.displayName}
              {member.job_title ? ` · ${member.job_title}` : ""}
              <button
                type="button"
                aria-label={`Keluarkan ${member.display_name || member.displayName} dari proyek`}
                onClick={() => toggle(member.id)}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
        <ul className="project-members-options">
          {selectable.map((member) => {
            const isSelected = selected.includes(member.id);
            return (
              <li key={member.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  className={isSelected ? "is-selected" : ""}
                  onClick={() => toggle(member.id)}
                >
                  {member.display_name || member.displayName}
                  {member.job_title ? ` · ${member.job_title}` : ""}
                  {isSelected ? " ✓" : ""}
                </button>
              </li>
            );
          })}
        </ul>
        {!selectable.length && (
          <small className="field__hint">
            Belum ada anggota aktif yang dapat dipilih.
          </small>
        )}
      </fieldset>
      <div className="project-dialog-actions">
        <Button type="button" variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Menyimpan…" : "Simpan proyek"}
        </Button>
      </div>
    </form>
  );
}
