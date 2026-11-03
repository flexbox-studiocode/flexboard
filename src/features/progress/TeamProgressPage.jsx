import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, PageHeader, Panel } from "../../components/ui/index.js";
import { FilterToolbar } from "../common/FeatureUI.jsx";
import CollectionState from "../common/CollectionState.jsx";
import useScopedCollection from "../common/useScopedCollection.js";
import MemberProgressList from "./MemberProgressList.jsx";
import { toProgressEntry } from "../common/apiAdapters.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { usePageResource } from "../common/usePageResource.js";
import "./progress.css";

export default function TeamProgressPage({ progress } = {}) {
  const { profile } = useAuth();
  const resource = usePageResource(progress, "/progress/team", data => (data?.progress || []).map(toProgressEntry));
  const state = useScopedCollection(resource);
  const canCreate = profile?.capabilities?.createTask === true;
  return <div className="feature-page progress-page"><PageHeader title="Progres Tim" description="Lihat perkembangan setiap anggota di seluruh tugas." actions={canCreate ? <Link className="button" to="/tasks/new"><Plus size={18} aria-hidden="true" />Tambah tugas</Link> : <Button disabled title="Hanya Leader dan Admin yang dapat membuat tugas"><Plus size={18} aria-hidden="true" />Tambah tugas</Button>} /><Panel className="progress-panel" aria-labelledby="member-progress-title"><div className="progress-panel__heading"><h2 id="member-progress-title">Progres per anggota</h2>{state.status === "unavailable" && <span>Data belum tersedia</span>}</div><FilterToolbar placeholder="Cari anggota…" member /><CollectionState state={state} unavailable={{ title: "Progres tim belum dapat dimuat", description: "Layanan progres belum terhubung." }} empty={{ title: "Belum ada progres anggota", description: "Tidak ada anggota dalam cakupan yang berhasil dimuat." }} loadingTitle="Memuat progres tim" errorTitle="Progres tim gagal dimuat">{items => <MemberProgressList entries={items} />}</CollectionState><p className="progress-panel__note">Persentase dihitung dari checklist aktif yang ditugaskan kepada masing-masing anggota. Anggota tanpa checklist belum memiliki indikator progres.</p></Panel></div>;
}
