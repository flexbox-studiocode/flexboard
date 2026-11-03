import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { PageHeader, Panel, ProgressBar, UnavailableState, Button } from "../../components/ui/index.js";
import { SectionHeading } from "../common/FeatureUI.jsx";
import ProjectPicker from "../projects/ProjectPicker.jsx";
import { listTasks } from "../tasks/taskApi.js";
import { requestTaskApi } from "../tasks/taskApi.js";
import { listMembers } from "../members/memberApi.js";
import { toTaskCard, toActivityEntry } from "../common/apiAdapters.js";
import "./dashboard.css";

export default function DashboardPage() {
  const { profile } = useAuth();
  const canCreate = profile?.capabilities?.createTask === true;
  const canManageProjects = profile?.role === "leader";
  const [tasks, setTasks] = useState(null);
  const [members, setMembers] = useState(null);
  const [activity, setActivity] = useState(null);
  const [projects, setProjects] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      listTasks().catch(() => null),
      listMembers().catch(() => null),
      requestTaskApi("/activity").catch(() => null),
      requestTaskApi("/projects").catch(() => null),
    ]).then(([taskData, memberData, activityData, projectData]) => {
      if (!active) return;
      if (taskData?.tasks) setTasks(taskData.tasks.map(toTaskCard));
      if (memberData?.members) setMembers(memberData.members);
      if (activityData?.activity) setActivity(activityData.activity.slice(0, 5).map(toActivityEntry));
      if (projectData?.projects) setProjects(projectData.projects);
    });
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      Promise.all([listTasks().catch(() => null), listMembers().catch(() => null), requestTaskApi("/activity").catch(() => null)])
        .then(([taskData, memberData, activityData]) => {
          if (!active) return;
          if (taskData?.tasks) setTasks(taskData.tasks.map(toTaskCard));
          if (memberData?.members) setMembers(memberData.members);
          if (activityData?.activity) setActivity(activityData.activity.slice(0, 5).map(toActivityEntry));
        });
    }, 5000);
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      Promise.all([listTasks().catch(() => null), listMembers().catch(() => null), requestTaskApi("/activity").catch(() => null)])
        .then(([taskData, memberData, activityData]) => {
          if (!active) return;
          if (taskData?.tasks) setTasks(taskData.tasks.map(toTaskCard));
          if (memberData?.members) setMembers(memberData.members);
          if (activityData?.activity) setActivity(activityData.activity.slice(0, 5).map(toActivityEntry));
        });
    };
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("online", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  const activeTasks = tasks?.filter(t => t.status !== "archived") || [];
  const doneTasks = tasks?.filter(t => t.status === "done") || [];
  const avgProgress = activeTasks.length ? Math.round(activeTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / activeTasks.length) : null;
  const activeMembers = members?.filter(m => m.is_active !== false) || [];
  const activeProjects = projects?.filter(p => p.archived_at == null) || [];
  return (
    <div className="feature-page dashboard-page">
      <PageHeader title="Beranda" actions={canCreate ? <Link className="button" to="/tasks/new"><Plus size={18} aria-hidden="true" />Tambah tugas</Link> : <Button disabled><Plus size={18} aria-hidden="true" />Tambah tugas</Button>} />
      <p className="dashboard-intro">Pekerjaan yang sedang berjalan di FlexBox</p>
      <Panel className="dashboard-shared-task" aria-label="Tugas bersama">
        <div className="dashboard-task-heading">
          <h2>Tugas bersama</h2>
          <span className="dashboard-task-status">{tasks ? `${activeTasks.length} tugas aktif · ${doneTasks.length} selesai` : "Status belum tersedia"}</span>
        </div>
        {tasks ? (activeTasks.length ? (
          <ul className="dashboard-task-list">{activeTasks.slice(0, 3).map(task => <li key={task.id}><Link to={`/tasks/${task.id}`}>{task.title}</Link><span className="dashboard-task-progress">{task.progress || 0}%</span></li>)}</ul>
        ) : <p className="dashboard-empty">Tidak ada tugas aktif.</p>) : <UnavailableState title="Tugas bersama belum dapat dimuat" description="Buka Tugas Kami untuk memuat daftar tugas sesuai akses Anda." />}
        <div className="dashboard-task-footer">
          <ProgressBar value={avgProgress} label="Akumulasi progres" unavailableLabel="Belum tersedia" />
          <Link className="button button--secondary" to="/tasks">Lihat tugas</Link>
        </div>
      </Panel>
      <Panel className="dashboard-team" aria-label="Tim FlexBox">
        <SectionHeading title="Tim FlexBox" to="/members" linkLabel="Lihat anggota" />
        {members ? (
          <div className="dashboard-team-summary">
            <p><strong>{activeMembers.length}</strong> anggota aktif</p>
            <ul className="dashboard-team-roles">{['leader', 'admin', 'member'].map(role => { const count = activeMembers.filter(m => m.role === role).length; return count ? <li key={role}>{role}: {count}</li> : null; })}</ul>
          </div>
        ) : <p className="dashboard-team-unavailable">Daftar anggota belum tersedia.</p>}
        <p className="dashboard-team-caption">Leader mengatur tugas. Anggota mengerjakan checklist sesuai izin.</p>
      </Panel>
      <section className="dashboard-activity" aria-label="Ringkasan aktivitas">
        <SectionHeading title="Aktivitas terbaru" to="/activity" linkLabel="Semua aktivitas" />
        <Panel>
          {activity ? (activity.length ? (
            <ul className="dashboard-activity-list">{activity.map(entry => <li key={entry.id}><strong>{entry.actorLabel}</strong> {entry.actionLabel}{entry.objectLabel ? ` ${entry.objectLabel}` : ""}<small>{entry.timeLabel}</small></li>)}</ul>
          ) : <UnavailableState title="Belum ada aktivitas" description="Perubahan pekerjaan yang tersimpan di server akan ditampilkan di sini." />) : <UnavailableState title="Aktivitas belum tersedia" description="Memuat aktivitas terbaru dari server." />}
        </Panel>
      </section>
      {canManageProjects && (
        <section className="dashboard-project-tools" aria-label="Pengelolaan proyek">
          <h2>Pengelolaan proyek</h2>
          <p className="dashboard-project-caption">{activeProjects.length} proyek aktif yang dapat Anda kelola sebagai Leader.</p>
          <ProjectPicker lazy />
        </section>
      )}
    </div>
  );
}
