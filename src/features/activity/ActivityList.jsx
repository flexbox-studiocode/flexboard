import { Link } from "react-router-dom";
import { Avatar, EmptyState, UnavailableState } from "../../components/ui/index.js";
import "./activity.css";

const ACTION_LABELS = {
  "project.created": "membuat proyek",
  "project.updated": "memperbarui proyek",
  "project.members_updated": "memperbarui anggota proyek",
  "task.created": "membuat tugas",
  "task.updated": "memperbarui tugas",
  "task.assignees_updated": "memperbarui penanggung jawab tugas",
  "task.archived": "mengarsipkan tugas",
  "checklist.created": "menambah checklist",
  "checklist.updated": "memperbarui checklist",
  "checklist.completed": "menyelesaikan checklist",
  "checklist.uncompleted": "membuka kembali checklist",
  "comment.created": "mengomentari tugas",
  "update.created": "melaporkan update pekerjaan",
  "member.created": "menambah anggota",
  "member.updated": "memperbarui anggota",
  "member.role_changed": "mengubah role anggota",
  "member.activated": "mengaktifkan anggota",
  "member.deactivated": "menonaktifkan anggota",
};

function labelFor(action) {
  if (typeof action !== "string") return null;
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  return action.replace(/[._]/g, " ");
}

export default function ActivityList({ entries }) {
  if (!Array.isArray(entries)) return <UnavailableState title="Riwayat belum tersedia" description="Layanan aktivitas belum terhubung." />;
  if (!entries.length) return <EmptyState title="Belum ada aktivitas" description="Belum ada catatan aktivitas dalam cakupan yang dimuat." />;
  return <ol className="activity-list">{entries.map(entry => <li key={entry.id}><Avatar name={entry.actorLabel || ""} className="activity-list__avatar" /><div className="activity-list__content"><p className="activity-list__title"><strong>{entry.actorLabel}</strong> {labelFor(entry.actionLabel)} {entry.objectPath ? <Link to={entry.objectPath}>{entry.objectLabel}</Link> : entry.objectLabel}</p><div className="activity-list__meta">{entry.projectLabel && <span className="activity-list__project">{entry.projectLabel}</span>}{entry.timeLabel && (entry.dateTime ? <time dateTime={entry.dateTime}>{entry.timeLabel}</time> : <span className="activity-list__time">{entry.timeLabel}</span>)}</div>{entry.description && <p className="activity-list__description">{entry.description}</p>}</div></li>)}</ol>;
}
