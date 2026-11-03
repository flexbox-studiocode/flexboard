import { useEffect, useState } from "react";
import { LayoutList, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { PageHeader, Panel, ProgressBar } from "../../components/ui/index.js";
import { FilterToolbar } from "../common/FeatureUI.jsx";
import CollectionState from "../common/CollectionState.jsx";
import useScopedCollection from "../common/useScopedCollection.js";
import TaskCard from "./TaskCard.jsx";
import MemberProgressList from "../progress/MemberProgressList.jsx";
import { listMembers, listProjects } from "./taskApi.js";
import { toTaskCard, toProgressEntry } from "../common/apiAdapters.js";
import { usePageResource } from "../common/usePageResource.js";
import "./tasks.css";

export default function TasksPage({ tasks, members }) {
  const { profile } = useAuth();
  const taskState = usePageResource(tasks, "/tasks", data => (data?.tasks || []).map(toTaskCard));
  const state = useScopedCollection(taskState);
  const [projectRows, setProjectRows] = useState([]);
  const [memberRows, setMemberRows] = useState(members?.items || []);
  const [progressState, setProgressState] = useState({ status: "loading", scope: "/tasks" });
  useEffect(() => {
    let active = true;
    Promise.all([listProjects(), listMembers()]).then(([projects, people]) => {
      if (!active) return;
      setProjectRows(projects?.projects || []);
      setMemberRows(people?.members || []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    const load = (showLoading = true) => {
      if (showLoading) setProgressState({ status: "loading", scope: "/tasks" });
      listMembers().then(data => active && setProgressState({ status: "success", scope: "/tasks", items: (data?.members || []).map(toProgressEntry) })).catch(() => active && setProgressState({ status: "error", scope: "/tasks" }));
    };
    load();
    const timer = window.setInterval(() => { if (document.visibilityState !== "hidden") load(false); }, 5000);
    const refresh = () => { if (document.visibilityState === "visible") load(false); };
    window.addEventListener("online", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("online", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  const memberState = useScopedCollection(members !== undefined ? members : progressState);
  return <div className="feature-page tasks-page"><PageHeader title="Tugas Kami" description="Satu ruang tugas bersama, perkembangan pekerjaan masing-masing anggota." actions={profile?.capabilities?.createTask ? <Link className="button" to="/tasks/new"><Plus size={20} strokeWidth={1.5} aria-hidden="true" />Tambah tugas</Link> : null} /><Panel className="feature-panel task-filters" aria-label="Pencarian dan filter tugas"><FilterToolbar placeholder="Cari judul, deskripsi, proyek, atau anggota…" projects={projectRows} members={memberRows} member dates taskFilters /></Panel><section className="task-workspace" aria-labelledby="task-list-title"><h2 className="task-workspace__label" id="task-list-title"><LayoutList size={16} aria-hidden="true" />Daftar tugas</h2><Panel className="feature-panel task-summary" aria-label="Ringkasan tugas"><div className="task-summary__heading"><span>TUGAS BERSAMA</span><span>{state.status === "success" ? `${state.items.length} tugas` : "Data terbaru"}</span></div><CollectionState state={state} unavailable={{ title: "Daftar tugas belum dapat dimuat", description: "Layanan tugas belum terhubung." }} empty={{ title: "Tidak ada tugas dalam hasil ini", description: "Daftar tugas kosong." }} loadingTitle="Memuat daftar tugas…" errorTitle="Daftar tugas gagal dimuat">{items => <div className="stack">{items.map(item => <TaskCard key={item.id} {...item} />)}</div>}</CollectionState><ProgressBar label="Progres tim" unavailableLabel="Belum tersedia" /></Panel><Panel className="feature-panel task-members" aria-labelledby="task-members-title"><div className="task-members__heading"><h2 id="task-members-title">Progres anggota</h2><p>Progres bersumber dari checklist tersimpan.</p></div><CollectionState state={memberState} unavailable={{ title: "Progres anggota belum tersedia", description: "Data belum tersedia." }} empty={{ title: "Belum ada progres anggota", description: "Tidak ada progres." }} loadingTitle="Memuat progres anggota…" errorTitle="Progres anggota gagal dimuat">{items => <MemberProgressList entries={items} />}</CollectionState></Panel></section></div>;
}
