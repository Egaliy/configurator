export type StageStatus = 'in_progress' | 'completed' | 'upcoming'

export interface Stage {
  id: string
  name: string
  startDate: string
  endDate: string
  status: StageStatus
  /** Описание/наполнение этапа: админы редактируют, гости читают */
  description?: string
}

/** Мгновенное событие (встреча, ревью) — одна точка на оси времени, привязана к этапу */
export interface TimelineEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  stageId: string
  type?: 'meeting' | 'review' | 'milestone'
}

export interface CommentAttachment {
  id: string
  name: string
  type: 'image' | 'file'
  /** data URL (base64) for in-memory storage */
  dataUrl: string
}

export interface Comment {
  id: string
  author: string
  text: string
  stageId: string | null
  createdAt: string
  attachments?: CommentAttachment[]
}

export interface Project {
  id: string
  name: string
  stages: Stage[]
  events: TimelineEvent[]
  comments: Comment[]
}

function dateFromToday(dayOffset: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + dayOffset)
  return d.toISOString().slice(0, 10)
}

const stages: Stage[] = [
  { id: '1', name: 'Research', startDate: dateFromToday(-10), endDate: dateFromToday(-8), status: 'completed', description: 'Gathering requirements, stakeholder interviews, competitor analysis.' },
  { id: '2', name: 'Design Concept', startDate: dateFromToday(-7), endDate: dateFromToday(-4), status: 'completed', description: 'Concept and moodboards, visual direction approval.' },
  { id: '3', name: 'Wireframes', startDate: dateFromToday(-3), endDate: dateFromToday(0), status: 'in_progress', description: 'Screen structure, user flows and scenarios.' },
  { id: '4', name: 'High-fidelity', startDate: dateFromToday(1), endDate: dateFromToday(4), status: 'upcoming' },
  { id: '5', name: 'Dev', startDate: dateFromToday(5), endDate: dateFromToday(12), status: 'upcoming' },
  { id: '6', name: 'QA', startDate: dateFromToday(13), endDate: dateFromToday(15), status: 'upcoming' },
]

const events: TimelineEvent[] = [
  { id: 'e1', title: 'Kickoff', date: dateFromToday(-10), stageId: '1', type: 'meeting' },
  { id: 'e2', title: 'Design review', date: dateFromToday(-4), stageId: '2', type: 'review' },
  { id: 'e3', title: 'Wireframes review', date: dateFromToday(0), stageId: '3', type: 'review' },
  { id: 'e4', title: 'Handoff to dev', date: dateFromToday(5), stageId: '5', type: 'milestone' },
]

const comments: Comment[] = [
  { id: 'c1', author: 'Designer', text: 'Wireframes for main flow are ready. Please review.', stageId: '3', createdAt: '2025-02-08T14:00:00' },
  { id: 'c2', author: 'Client', text: 'Looks good. Can we make the CTA more prominent?', stageId: '3', createdAt: '2025-02-08T16:30:00' },
  { id: 'c3', author: 'Designer', text: 'Updated. New version attached.', stageId: null, createdAt: '2025-02-09T10:00:00' },
]

export const mockProject: Project = {
  id: 'proj-1',
  name: 'Website Redesign',
  stages,
  events,
  comments,
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Добавить days к дате YYYY-MM-DD, вернуть YYYY-MM-DD */
export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
