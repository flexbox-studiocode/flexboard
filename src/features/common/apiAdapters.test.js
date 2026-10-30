import { describe, expect, it } from 'vitest'
import { toActivityEntry, toChecklistItem, toMemberCard, toTaskCard } from './apiAdapters.js'

describe('apiAdapters date-only contract', () => {
  it('formats a DATE column (YYYY-MM-DD) as DD/MM/YYYY and never appends a time', () => {
    const card = toTaskCard({ id: 't1', title: 'Tugas', due_at: '2026-10-30' })
    expect(card.dueLabel).toBe('30/10/2026')
    expect(card.dueLabel).not.toMatch(/\d{2}:\d{2}/)
  })

  it('does not shift the day under timezone conversion', () => {
    // A plain date must map back to the same calendar day regardless of process TZ.
    expect(toTaskCard({ id: 't', due_at: '2026-01-01' }).dueLabel).toBe('01/01/2026')
    expect(toTaskCard({ id: 't', due_at: '2026-12-31' }).dueLabel).toBe('31/12/2026')
  })

  it('returns null due label when no due date is present', () => {
    expect(toTaskCard({ id: 't' }).dueLabel).toBeNull()
    expect(toTaskCard({ id: 't', due_at: null }).dueLabel).toBeNull()
  })
})

describe('apiAdapters member card', () => {
  it('passes through role, job title, status, counts and permissions from server rows', () => {
    const card = toMemberCard({
      id: 'm1', display_name: 'Kiandra', job_title: 'Backend', role: 'admin', is_active: true,
      active_task_count: 3, progress: '60.00', permissions: { edit: true, changeRole: true },
    })
    expect(card.name).toBe('Kiandra')
    expect(card.role).toBe('admin')
    expect(card.job_title).toBe('Backend')
    expect(card.is_active).toBe(true)
    expect(card.activeTaskCount).toBe(3)
    expect(card.progress).toBe(60)
    expect(card.permissions).toEqual({ edit: true, changeRole: true })
    // roleLabel carries the job title; the role badge is rendered separately by MemberCard.
    expect(card.roleLabel).toBe('Backend')
  })

  it('never fabricates counts or progress when the server omits them', () => {
    const card = toMemberCard({ id: 'm2', display_name: 'X' })
    expect(card.activeTaskCount).toBeNull()
    expect(card.progress).toBeNull()
  })
})

describe('apiAdapters checklist and activity', () => {
  it('maps checklist assignee ownership from the server row', () => {
    const item = toChecklistItem({ id: 'c1', title: 'Backend', assignee_id: 'u1', assignee_name: 'Kiandra', is_completed: true })
    expect(item.assigneeId).toBe('u1')
    expect(item.assigneeName).toBe('Kiandra')
    expect(item.isCompleted).toBe(true)
  })

  it('keeps activity timestamps as datetime strings', () => {
    const entry = toActivityEntry({ id: 'a1', actor_name: 'Adit', action: 'task.created', created_at: '2026-10-30T08:00:00.000Z' })
    expect(entry.actorLabel).toBe('Adit')
    expect(entry.dateTime).toBe('2026-10-30T08:00:00.000Z')
  })
})
