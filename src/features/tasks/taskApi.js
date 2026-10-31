export async function requestTaskApi(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  if (response.status === 204) return null;
  const body = await response.json();
  return body?.data ?? body;
}

export const listTasks = () => requestTaskApi("/tasks");
export const getTask = (id) =>
  requestTaskApi(`/tasks/${encodeURIComponent(id)}`);
export const listProjects = () => requestTaskApi("/projects");
export const listMembers = () => requestTaskApi("/members");
export const listProjectMembers = (projectId) =>
  requestTaskApi(`/projects/${encodeURIComponent(projectId)}/members`);
export const createProject = (payload) =>
  requestTaskApi("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const updateProject = (projectId, payload) =>
  requestTaskApi(`/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const updateProjectMembers = (projectId, memberIds) =>
  requestTaskApi(`/projects/${encodeURIComponent(projectId)}/members`, {
    method: "PUT",
    body: JSON.stringify({ memberIds }),
  });
export const createTask = (payload) =>
  requestTaskApi("/tasks", { method: "POST", body: JSON.stringify(payload) });
export const updateTask = (id, payload) =>
  requestTaskApi(`/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
export const updateChecklistItem = (taskId, itemId, completed) =>
  requestTaskApi(
    `/tasks/${encodeURIComponent(taskId)}/checklists/${encodeURIComponent(itemId)}`,
    { method: "PATCH", body: JSON.stringify({ completed }) },
  );
export const updateChecklist = (taskId, itemId, item) =>
  requestTaskApi(
    `/tasks/${encodeURIComponent(taskId)}/checklists/${encodeURIComponent(itemId)}`,
    { method: "PATCH", body: JSON.stringify(item) },
  );
export const archiveTask = (id) =>
  requestTaskApi(`/tasks/${encodeURIComponent(id)}/archive`, {
    method: "POST",
  });
export const listChecklist = (taskId) =>
  requestTaskApi(`/tasks/${encodeURIComponent(taskId)}/checklists`);
export const addChecklist = (taskId, items) =>
  requestTaskApi(`/tasks/${encodeURIComponent(taskId)}/checklists`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
export const listComments = (taskId) =>
  requestTaskApi(`/tasks/${encodeURIComponent(taskId)}/comments`);
export const addComment = (taskId, body) =>
  requestTaskApi(`/tasks/${encodeURIComponent(taskId)}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
export const listUpdates = (taskId) =>
  requestTaskApi(`/tasks/${encodeURIComponent(taskId)}/updates`);
export const addUpdate = (taskId, workSummary, blockers = "") =>
  requestTaskApi(`/tasks/${encodeURIComponent(taskId)}/updates`, {
    method: "POST",
    body: JSON.stringify({ workSummary, blockers }),
  });
