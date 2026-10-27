import { Link, Route, Routes } from 'react-router-dom'
import WorkspaceLayout from '../components/layout/WorkspaceLayout.jsx'
import { PageHeader, Panel } from '../components/ui/index.js'
import LoginPage from '../features/auth/LoginPage.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import TasksPage from '../features/tasks/TasksPage.jsx'
import TaskDetailPage from '../features/tasks/TaskDetailPage.jsx'
import TaskFormPage from '../features/tasks/TaskFormPage.jsx'
import TeamProgressPage from '../features/progress/TeamProgressPage.jsx'
import MembersPage from '../features/members/MembersPage.jsx'
import ActivityPage from '../features/activity/ActivityPage.jsx'
import '../features/common/features.css'

function NotFoundPage() {
  return <><PageHeader title="Halaman tidak ditemukan" description="Alamat yang dibuka tidak tersedia di workspace ini." /><Panel><Link to="/" className="button button--primary">Kembali ke Beranda</Link></Panel></>
}

export default function AppRoutes() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route element={<WorkspaceLayout />}><Route index element={<DashboardPage />} /><Route path="tasks" element={<TasksPage />} /><Route path="tasks/new" element={<TaskFormPage />} /><Route path="tasks/:id" element={<TaskDetailPage />} /><Route path="tasks/:id/edit" element={<TaskFormPage />} /><Route path="team-progress" element={<TeamProgressPage />} /><Route path="members" element={<MembersPage />} /><Route path="activity" element={<ActivityPage />} /><Route path="*" element={<NotFoundPage />} /></Route></Routes>
}
