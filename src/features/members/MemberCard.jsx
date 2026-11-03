import { Avatar, Badge, Panel, ProgressBar } from "../../components/ui/index.js";
import "./members.css";

const displayLabel = value => typeof value === "string" && value.trim() ? value : "—";

export default function MemberCard({
  id, name, display_name, role, roleLabel, jobTitle, job_title,
  statusLabel, is_active, activeTaskCount, checklistCount, completedChecklist, completionPercent,
  progress, progressStatus, permissions, onEdit, onDeactivate, onActivate, onChangeRole,
}) {
  const label = name || display_name;
  const title = jobTitle ?? job_title;
  const roleText = role === "leader" ? "Leader" : role === "admin" ? "Admin" : role === "member" ? "Member" : "";
  const subtitle = roleLabel || (title ? title : roleText ? `— · ${roleText}` : "");
  const status = statusLabel || (typeof is_active === "boolean" ? is_active ? "Aktif" : "Tidak aktif" : "");
  const countAvailable = Number.isSafeInteger(activeTaskCount) && activeTaskCount >= 0;
  const checklistTotal = typeof checklistCount === "number" && Number.isFinite(checklistCount) ? checklistCount : null;
  const checklistDone = typeof completedChecklist === "number" && Number.isFinite(completedChecklist) ? completedChecklist : null;
  const effectiveProgress = typeof completionPercent === "number" && Number.isFinite(completionPercent) ? completionPercent : (typeof progress === "number" && Number.isFinite(progress) ? progress : null);
  const statusText = progressStatus === "COMPLETE" ? "Selesai" : progressStatus === "IN_PROGRESS" ? "Sedang berjalan" : progressStatus === "NOT_STARTED" ? "Belum dimulai" : progressStatus === "NO_ASSIGNED_CHECKLIST" ? "Belum ada checklist yang ditugaskan" : null;
  const perms = permissions || {};
  const hasActions = (onEdit && (perms.edit || perms.changeRole)) || onDeactivate || onActivate || onChangeRole;
  return (
    <Panel className="member-card">
      <div className="member-card__heading">
        <Avatar name={typeof label === "string" ? label : ""} />
        <div>
          <h3>{displayLabel(label)}</h3>
          <p>{displayLabel(subtitle)}</p>
        </div>
      </div>
      {roleText && (
        <div className="member-card__role">
          <Badge tone={role === "leader" ? "success" : role === "admin" ? "info" : "neutral"}>{roleText}</Badge>
        </div>
      )}
      <dl className="member-card__details">
        <div>
          <dt>Status akun</dt>
          <dd><Badge>{displayLabel(status)}</Badge></dd>
        </div>
        <div>
          <dt>Tugas aktif</dt>
          <dd>{countAvailable ? activeTaskCount : "—"}</dd>
        </div>
        <div>
          <dt>Checklist</dt>
          <dd>{checklistTotal == null ? "—" : `${checklistDone ?? 0} / ${checklistTotal}`}</dd>
        </div>
      </dl>
      <ProgressBar value={effectiveProgress} label="Progres pekerjaan" unavailableLabel={statusText || "Belum tersedia"} />
      {statusText && <p className="member-card__progress-status">{statusText}</p>}
      {hasActions && (
        <div className="member-card__actions">
          {onEdit && perms.edit && <button type="button" className="member-action" onClick={() => onEdit(id)}>Edit</button>}
          {onChangeRole && perms.changeRole && role !== "leader" && <button type="button" className="member-action" onClick={() => onChangeRole(id)}>Ubah role</button>}
          {onDeactivate && perms.deactivate && is_active !== false && <button type="button" className="member-action member-action--danger" onClick={() => onDeactivate(id)}>Nonaktifkan</button>}
          {onActivate && perms.activate && is_active === false && <button type="button" className="member-action" onClick={() => onActivate(id)}>Aktifkan kembali</button>}
        </div>
      )}
    </Panel>
  );
}
