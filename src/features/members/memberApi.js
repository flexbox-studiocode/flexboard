import { requestTaskApi } from "../tasks/taskApi.js";

export const listMembers = () => requestTaskApi("/members");
export const getMember = (id) =>
  requestTaskApi(`/members/${encodeURIComponent(id)}`);
export const createMember = (payload) =>
  requestTaskApi("/members", { method: "POST", body: JSON.stringify(payload) });
export const updateMember = (id, payload) =>
  requestTaskApi(`/members/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const deactivateMember = (id) =>
  requestTaskApi(`/members/${encodeURIComponent(id)}/deactivate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
export const activateMember = (id) =>
  requestTaskApi(`/members/${encodeURIComponent(id)}/activate`, {
    method: "POST",
    body: JSON.stringify({}),
  });

export const roleLabel = (role) =>
  role === "leader"
    ? "Leader"
    : role === "admin"
      ? "Admin"
      : role === "member"
        ? "Member"
        : "—";
