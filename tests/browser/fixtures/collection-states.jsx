// Test-only presentation harness. Not imported by application entry points or production build.
import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import TasksPage from '../../../src/features/tasks/TasksPage.jsx'
import TeamProgressPage from '../../../src/features/progress/TeamProgressPage.jsx'
import MembersPage from '../../../src/features/members/MembersPage.jsx'
import ActivityPage from '../../../src/features/activity/ActivityPage.jsx'
import '../../../src/styles/global.css'

const long = 'TeksUjiPanjangTanpaSpasi'.repeat(15)
const routes = { tasks: '/tasks', progress: '/team-progress', members: '/members', activity: '/activity' }
const rows = {
  tasks: [{ id: 'task-test', title: long, description: long, projectLabel: long, dueLabel: long, progress: 0 }],
  progress: [{ id: 'progress-test', name: long, projectLabel: long, progress: 0, averageProgress: null }],
  members: [{ id: 'member-test', name: long, roleLabel: long, statusLabel: long, activeTaskCount: 0, progress: null }],
  activity: [{ id: 'activity-test', actorLabel: long, actionLabel: long, objectLabel: long, description: long }],
}

export function Harness({ pageName }) {
  const [status, setStatus] = useState('unavailable')
  const [retryCount, setRetryCount] = useState(0)
  const resource = { status: status === 'empty' ? 'success' : status, scope: routes[pageName], items: status === 'empty' ? [] : rows[pageName], onRetry: () => setRetryCount(count => count + 1) }
  const pages = {
    tasks: <TasksPage tasks={resource} />,
    progress: <TeamProgressPage progress={resource} />,
    members: <MembersPage members={resource} />,
    activity: <ActivityPage activity={resource} />,
  }
  return <><nav aria-label="Test state controls">{['unavailable', 'loading', 'error', 'empty', 'success'].map(value => <button key={value} onClick={() => setStatus(value)}>{value}</button>)}</nav><output aria-label="Retry count">{retryCount}</output><main className="workspace-main">{pages[pageName]}</main></>
}

const pageName = new URLSearchParams(window.location.search).get('page')
if (Object.hasOwn(routes, pageName)) {
  createRoot(document.getElementById('root')).render(<React.StrictMode><MemoryRouter initialEntries={[routes[pageName]]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Harness pageName={pageName} /></MemoryRouter></React.StrictMode>)
}
