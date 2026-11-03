import { Avatar, EmptyState, ProgressBar, UnavailableState } from "../../components/ui/index.js";

const label = value => typeof value === "string" && value.trim() ? value : "—";
const valid = value => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
const statusLabel = status => ({ COMPLETE: "Selesai", IN_PROGRESS: "Sedang berjalan", NOT_STARTED: "Belum dimulai", NO_ASSIGNED_CHECKLIST: "Belum ada checklist yang ditugaskan" }[status] || "Status belum tersedia");
export default function MemberProgressList({ entries }) {
  if (!Array.isArray(entries)) return <UnavailableState title="Progres tim belum dapat dimuat" description="Data progres belum tersedia." />;
  if (!entries.length) return <EmptyState title="Belum ada progres anggota" description="Tidak ada anggota dalam cakupan yang berhasil dimuat." />;
  return <ul className="member-progress-list">{entries.map(entry => <li key={entry.id}><div className="member-progress-list__member"><Avatar name={entry.name || ""} /><div><h3>{label(entry.name)}</h3><p>{label(entry.roleLabel)}</p></div></div><div className="member-progress-list__project"><h4>{entry.activeTaskCount == null ? "Tugas aktif belum tersedia" : `${entry.activeTaskCount} tugas aktif`}</h4><span>{entry.completedChecklist ?? "—"} / {entry.checklistCount ?? "—"} checklist selesai</span><small>{statusLabel(entry.progressStatus)}</small></div><ProgressBar value={entry.progress} label={`Progres ${label(entry.name)}`} unavailableLabel="Belum tersedia" /><div className="member-progress-list__average"><strong>{valid(entry.progress) ? `${Math.round(entry.progress)}%` : "—"}</strong><span>progres</span></div></li>)}</ul>;
}
