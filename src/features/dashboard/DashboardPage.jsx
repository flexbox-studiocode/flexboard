import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  PageHeader,
  Panel,
  ProgressBar,
  UnavailableState,
  Button,
} from "../../components/ui/index.js";
import { SectionHeading } from "../common/FeatureUI.jsx";
import ProjectPicker from "../projects/ProjectPicker.jsx";
import { listTasks } from "../tasks/taskApi.js";
import { listMembers } from "../members/memberApi.js";
import { toTaskCard } from "../common/apiAdapters.js";
import "./dashboard.css";

export default function DashboardPage() {
  const { profile } = useAuth();
  const canCreate = profile?.capabilities?.createTask === true;
  const [tasks, setTasks] = useState(null);
  const [members, setMembers] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([listTasks().catch(() => null), listMembers().catch(() => null)])
      .then(([taskData, memberData]) => {
        if (!active) return;
        if (taskData?.tasks) setTasks(taskData.tasks.map(toTaskCard));
        if (memberData?.members) setMembers(memberData.members);
      });
    return () => { active = false; };
  }, []);

  const activeTasks = tasks?.filter(t => t.status !== 'archived') || [];
  const avgProgress = activeTasks.length
    ? Math.round(activeTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / activeTasks.length)
    : null;
  const activeMembers = members?.filter(m => m.is_active !== false) || [];

  return (
    <div className="feature-page dashboard-page">
      <PageHeader
        title="Beranda"
        actions={
          canCreate ? (
            <Link className="button" to="/tasks/new">
              <Plus size={18} aria-hidden="true" />
              Tambah tugas
            </Link>
          ) : (
            <Button disabled>
              <Plus size={18} aria-hidden="true" />
              Tambah tugas
            </Button>
          )
        }
      />
      <p className="dashboard-intro">
        Pekerjaan yang sedang berjalan di FlexBox
      </p>
      <Panel className="dashboard-shared-task" aria-label="Tugas bersama">
        <div className="dashboard-task-heading">
          <h2>Tugas bersama</h2>
          <span className="dashboard-task-status">
            {tasks ? `${activeTasks.length} tugas aktif` : "Status belum tersedia"}
          </span>
        </div>
        {tasks ? (
          activeTasks.length ? (
            <ul className="dashboard-task-list">
              {activeTasks.slice(0, 3).map(task => (
                <li key={task.id}>
                  <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                  <span className="dashboard-task-progress">{task.progress || 0}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty">Tidak ada tugas aktif.</p>
          )
        ) : (
          <UnavailableState
            title="Tugas bersama belum dapat dimuat"
            description="Buka Tugas Kami untuk memuat daftar tugas sesuai akses Anda."
          />
        )}
        <div className="dashboard-task-footer">
          <ProgressBar
            value={avgProgress}
            label="Akumulasi progres"
            unavailableLabel="Belum tersedia"
          />
          <Link className="button button--secondary" to="/tasks">
            Lihat tugas
          </Link>
        </div>
      </Panel>
      <Panel className="dashboard-team" aria-label="Tim FlexBox">
        <SectionHeading
          title="Tim FlexBox"
          to="/members"
          linkLabel="Lihat anggota"
        />
        {members ? (
          <div className="dashboard-team-summary">
            <p><strong>{activeMembers.length}</strong> anggota aktif</p>
            <ul className="dashboard-team-roles">
              {['leader', 'admin', 'member'].map(role => {
                const count = activeMembers.filter(m => m.role === role).length;
                return count ? <li key={role}>{role}: {count}</li> : null;
              })}
            </ul>
          </div>
        ) : (
          <p className="dashboard-team-unavailable">
            Daftar anggota belum tersedia. Nama, peran, dan jumlah anggota akan
            mengikuti data server.
          </p>
        )}
        <p className="dashboard-team-caption">
          Leader mengatur tugas. Anggota mengerjakan checklist sesuai izin.
        </p>
      </Panel>
      <section className="dashboard-activity" aria-label="Ringkasan aktivitas">
        <SectionHeading
          title="Aktivitas terbaru"
          to="/activity"
          linkLabel="Semua aktivitas"
        />
        <Panel>
          <UnavailableState
            title="Aktivitas belum tersedia"
            description="Perubahan pekerjaan yang tersimpan di server akan ditampilkan di sini. Laporan pekerjaan tersedia melalui detail tugas setelah cakupannya disepakati."
          />
        </Panel>
      </section>
      <section
        className="dashboard-project-tools"
        aria-label="Pratinjau pengelolaan proyek"
      >
        <h2>Pengelolaan proyek</h2>
        <ProjectPicker lazy />
      </section>
    </div>
  );
}
