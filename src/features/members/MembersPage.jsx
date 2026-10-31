import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Plus, ShieldCheck } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  PageHeader,
  Panel,
  Select,
} from "../../components/ui/index.js";
import { FilterToolbar } from "../common/FeatureUI.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import CollectionState from "../common/CollectionState.jsx";
import useScopedCollection from "../common/useScopedCollection.js";
import AddMemberDialog from "./AddMemberDialog.jsx";
import EditMemberDialog from "./EditMemberDialog.jsx";
import MemberCard from "./MemberCard.jsx";
import { activateMember, deactivateMember, listMembers } from "./memberApi.js";
import { toMemberCard } from "../common/apiAdapters.js";
import "./members.css";

// Live page: reads from the server. Tests and composed parents may pass the collection state
// directly through `members`, in which case the generic FilterToolbar/scoped-collection contract
// is preserved exactly as before.
export default function MembersPage({ members } = {}) {
  const { pathname, search } = useLocation();
  const [params] = useSearchParams();
  const scope = `${pathname}${search}`;
  const { profile } = useAuth();
  const capabilities = profile?.capabilities || {};
  const canManage = capabilities.manageMembers === true;
  const canChangeRole = capabilities.changeRoles === true;
  const canCreateAdmin = capabilities.manageAdmins === true;

  const [apiState, setApiState] = useState({ status: "idle", scope });
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rawMembers, setRawMembers] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [actionState, setActionState] = useState({
    loading: false,
    error: null,
    success: null,
  });

  const load = useCallback(
    (showLoading = true) => {
      if (showLoading) setApiState(() => ({ status: "loading", scope }));
      return listMembers()
        .then((data) => {
          if (!Array.isArray(data?.members))
            throw new Error("Invalid members response");
          setRawMembers(data.members);
          setApiState({ status: "success", items: data.members, scope });
        })
        .catch(() => setApiState({ status: "error", scope }));
    },
    [scope],
  );

  useEffect(() => {
    if (members !== undefined) return;
    load(false);
  }, [members, load]); // eslint-disable-line react-hooks/set-state-in-effect

  const query = (params.get("q") || "").toLowerCase();
  const filtered = useMemo(() => {
    const source = members !== undefined ? members.items || [] : rawMembers;
    if (members !== undefined) return source;
    return source.filter((member) => {
      if (roleFilter && member.role !== roleFilter) return false;
      if (statusFilter === "active" && !member.is_active) return false;
      if (statusFilter === "inactive" && member.is_active) return false;
      if (query) {
        const haystack =
          `${member.display_name || ""} ${member.job_title || ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [rawMembers, members, roleFilter, statusFilter, query]);

  const state = useScopedCollection(members !== undefined ? members : apiState);
  const filteredState = useMemo(() => {
    if (state.status !== "success") return state;
    return { status: "success", items: filtered.map(toMemberCard) };
  }, [state, filtered]);

  const memberById = (id) => rawMembers.find((m) => m.id === id) || null;
  async function runAction(action, successMessage) {
    setActionState({ loading: true, error: null, success: null });
    try {
      await action();
      setActionState({ loading: false, error: null, success: successMessage });
      await load();
    } catch (err) {
      setActionState({
        loading: false,
        error:
          err.message === "HTTP_403"
            ? "Anda tidak memiliki izin untuk tindakan ini."
            : "Tindakan gagal.",
        success: null,
      });
    } finally {
      setConfirmTarget(null);
    }
  }

  const manageActions = canManage && members === undefined;

  return (
    <div className="feature-page members-page">
      <PageHeader
        title="Anggota"
        description="Kenali anggota workspace, tanggung jawab, dan perkembangan pekerjaannya."
        actions={
          canManage ? (
            <Button onClick={() => setAddOpen(true)}>
              <Plus size={18} aria-hidden="true" />
              Tambah anggota
            </Button>
          ) : null
        }
      />
      <Panel className="members-panel" aria-labelledby="members-list-title">
        <div className="members-panel__heading">
          <h2 id="members-list-title">Daftar anggota</h2>
          <Button variant="secondary" onClick={load}>
            Muat ulang
          </Button>
        </div>
        <FilterToolbar placeholder="Cari nama anggota…" member />
        {members === undefined && (
          <div className="members-role-filters">
            <Select
              label="Filter role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Semua role</option>
              <option value="leader">Leader</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </Select>
            <Select
              label="Filter status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak aktif</option>
            </Select>
          </div>
        )}
        {actionState.success && (
          <p role="status" className="members-action-status">
            {actionState.success}
          </p>
        )}
        {actionState.error && (
          <p role="alert" className="members-action-error">
            {actionState.error}
          </p>
        )}
        <CollectionState
          state={filteredState}
          unavailable={{
            title: "Daftar anggota belum dapat dimuat",
            description:
              "Layanan anggota belum terhubung. Ini bukan konfirmasi bahwa workspace tidak memiliki anggota. Akun, peran, dan ringkasan tugas tidak ditampilkan tanpa data server.",
          }}
          empty={{
            title: "Belum ada anggota",
            description:
              "Tidak ada anggota dalam cakupan yang berhasil dimuat.",
          }}
          loadingTitle="Memuat daftar anggota"
          errorTitle="Daftar anggota gagal dimuat"
        >
          {(items) => (
            <div className="feature-stats">
              {filtered.map((member, index) => (
                <MemberCard
                  key={member.id || items[index]?.id}
                  id={member.id}
                  name={member.name || member.display_name}
                  role={member.role}
                  jobTitle={member.job_title}
                  statusLabel={
                    member.statusLabel ||
                    (typeof member.is_active === "boolean"
                      ? member.is_active
                        ? "Aktif"
                        : "Tidak aktif"
                      : undefined)
                  }
                  is_active={member.is_active}
                  activeTaskCount={
                    member.activeTaskCount ?? member.active_task_count
                  }
                  progress={member.progress}
                  permissions={member.permissions}
                  onEdit={
                    manageActions
                      ? (id) => setEditTarget(memberById(id))
                      : undefined
                  }
                  onChangeRole={
                    manageActions
                      ? (id) => setRoleChangeTarget(memberById(id))
                      : undefined
                  }
                  onDeactivate={
                    manageActions
                      ? (id) => setConfirmTarget({ id, active: true })
                      : undefined
                  }
                  onActivate={
                    manageActions
                      ? (id) => setConfirmTarget({ id, active: false })
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </CollectionState>
        {!canManage && (
          <div className="members-access-note">
            <ShieldCheck size={20} aria-hidden="true" />
            <div>
              <h3>Pengelolaan akun terbatas</h3>
              <p>
                Hanya Leader dan Admin yang dapat menambah atau mengubah akun
                anggota.
              </p>
            </div>
          </div>
        )}
      </Panel>
      <AddMemberDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => load()}
        canCreateAdmin={canCreateAdmin}
      />
      <EditMemberDialog
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        member={editTarget}
        onSaved={() => load()}
        canChangeRole={canChangeRole && editTarget?.role !== "leader"}
      />
      <EditMemberDialog
        open={Boolean(roleChangeTarget)}
        onClose={() => setRoleChangeTarget(null)}
        member={roleChangeTarget}
        onSaved={() => load()}
        canChangeRole={canChangeRole}
        roleOnly
      />
      <ConfirmDialog
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        loading={actionState.loading}
        title={
          confirmTarget?.active
            ? "Nonaktifkan anggota"
            : "Aktifkan kembali anggota"
        }
        description={
          confirmTarget?.active
            ? "Akun akan dinonaktifkan: tidak dapat login, sesi dicabut, dan tidak muncul pada pilihan assignee. Riwayat tugas, komentar, dan aktivitas tetap dipertahankan."
            : "Akun akan diaktifkan kembali dan dapat login serta ditugaskan lagi."
        }
        confirmLabel={confirmTarget?.active ? "Nonaktifkan" : "Aktifkan"}
        onConfirm={() =>
          confirmTarget &&
          runAction(
            () =>
              confirmTarget.active
                ? deactivateMember(confirmTarget.id)
                : activateMember(confirmTarget.id),
            confirmTarget.active
              ? "Anggota dinonaktifkan."
              : "Anggota diaktifkan kembali.",
          )
        }
      />
    </div>
  );
}
