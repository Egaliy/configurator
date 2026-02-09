import { useState, useMemo } from 'react'
import type { Comment, Stage, TimelineEvent } from './projects/mockData'
import { mockProject, addDaysToDate } from './projects/mockData'
import {
  type Role,
  getStoredRole,
  setStoredRole,
  roleLabel,
  canComment,
  canEditStages,
} from './projects/auth'
import Timeline from './projects/Timeline'
import Feed from './projects/Feed'
import StagePanel from './projects/StagePanel'

const ROLES: Role[] = ['admin', 'client']

function getInitialRole(): Role {
  return getStoredRole() ?? 'client'
}

export default function ProjectsPage() {
  const [role, setRole] = useState<Role>(getInitialRole)
  const [comments, setComments] = useState<Comment[]>(mockProject.comments)
  const [stages, setStages] = useState<Stage[]>(mockProject.stages)
  const [events, setEvents] = useState<TimelineEvent[]>(mockProject.events)
  const [openStageId, setOpenStageId] = useState<string | null>(null)
  const [justAddedStageId, setJustAddedStageId] = useState<string | null>(null)
  const [scrollToStageId, setScrollToStageId] = useState<string | null>(null)

  const user = useMemo(
    () => ({ id: 'current', name: role === 'admin' ? 'Admin' : 'Client', role }),
    [role]
  )

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole)
    setStoredRole(newRole)
  }

  const handleDeleteComment = (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  const canDeleteComment = (comment: Comment) => {
    return role === 'admin' || comment.author === user.name
  }

  const handleAddComment = (
    text: string,
    stageId?: string | null,
    attachments?: { name: string; type: 'image' | 'file'; dataUrl: string }[]
  ) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: user.name,
      text,
      stageId: stageId ?? null,
      createdAt: new Date().toISOString(),
      attachments:
        attachments?.length
          ? attachments.map((a, i) => ({
          id: `att-${Date.now()}-${i}`,
          name: a.name,
          type: a.type,
          dataUrl: a.dataUrl,
        }))
          : undefined,
    }
    setComments((prev) => [newComment, ...prev])
  }

  const handleAddStage = () => {
    const last = stages[stages.length - 1]
    const lastEnd = last ? new Date(last.endDate) : new Date()
    lastEnd.setDate(lastEnd.getDate() + 1)
    const startStr = lastEnd.toISOString().slice(0, 10)
    const endDate = new Date(lastEnd)
    endDate.setDate(endDate.getDate() + 1)
    const endStr = endDate.toISOString().slice(0, 10)
    const newId = `s-${Date.now()}`
    setStages((prev) => [
      ...prev,
      {
        id: newId,
        name: 'New stage',
        startDate: startStr,
        endDate: endStr,
        status: 'upcoming',
      },
    ])
    setOpenStageId(newId)
    setJustAddedStageId(newId)
    setScrollToStageId(newId)
  }

  const handleStageDelete = (stageId: string) => {
    if (!window.confirm('Are you sure you want to delete this stage?')) return
    setStages((prev) => prev.filter((s) => s.id !== stageId))
    setEvents((prev) => prev.filter((e) => e.stageId !== stageId))
    if (openStageId === stageId) setOpenStageId(null)
  }

  const handleStageReorder = (stageId: string, direction: 'up' | 'down') => {
    setStages((prev) => {
      const i = prev.findIndex((s) => s.id === stageId)
      if (i < 0) return prev
      if (direction === 'up' && i === 0) return prev
      if (direction === 'down' && i === prev.length - 1) return prev
      const next = [...prev]
      const j = direction === 'up' ? i - 1 : i + 1
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const handleStageChange = (stageId: string, patch: Partial<Pick<Stage, 'startDate' | 'endDate'>>) => {
    setStages((prev) => {
      const stage = prev.find((s) => s.id === stageId)
      const newStages = prev.map((s) => (s.id === stageId ? { ...s, ...patch } : s))
      if (stage && patch.startDate != null && patch.endDate != null) {
        const deltaMs = new Date(patch.startDate).getTime() - new Date(stage.startDate).getTime()
        const deltaDays = Math.round(deltaMs / (24 * 60 * 60 * 1000))
        if (deltaDays !== 0) {
          setEvents((evPrev) =>
            evPrev.map((e) =>
              e.stageId === stageId ? { ...e, date: addDaysToDate(e.date, deltaDays) } : e
            )
          )
        }
      }
      return newStages
    })
  }

  const handleEventChange = (eventId: string, patch: { date: string }) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ...patch } : e)))
  }

  const handleStagePatch = (stageId: string, patch: Partial<Pick<Stage, 'description' | 'name'>>) => {
    setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, ...patch } : s)))
  }

  const allowComment = canComment(role)
  const allowEditStages = canEditStages(role)
  const openStage = openStageId ? stages.find((s) => s.id === openStageId) : null
  const openStageComments = openStageId
    ? comments.filter((c) => c.stageId === openStageId)
    : []

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      <div className="flex-none w-full px-4 sm:px-6 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-base opacity-60 tracking-tighter">
              Role:
            </span>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`px-6 py-3 rounded-lg border bg-transparent tracking-tighter text-base transition-colors ${
                    role === r
                      ? 'border-white/30 text-white'
                      : 'border-white/10 text-white/80 hover:border-white hover:text-white'
                  }`}
                >
                  {roleLabel(r)}
                </button>
              ))}
            </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative -mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)]">
          <Timeline
            stages={stages}
            events={events}
            canEdit={allowEditStages}
            onStageChange={handleStageChange}
            onEventChange={handleEventChange}
            onStageOpen={(id) => {
              setOpenStageId(id)
              if (id !== justAddedStageId) setJustAddedStageId(null)
            }}
            onStageReorder={handleStageReorder}
            onStageDelete={handleStageDelete}
            scrollToStageId={scrollToStageId}
            onScrollToStageIdDone={() => setScrollToStageId(null)}
            headerAction={
              allowEditStages ? (
                <button
                  type="button"
                  onClick={handleAddStage}
                  className="w-12 h-12 rounded-lg bg-white/25 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors text-2xl leading-none tracking-tighter"
                  title="Add stage"
                >
                  +
                </button>
              ) : null
            }
          fillHeight
          />
        </div>

        {false && (
          <div className="pt-8 border-t border-white/10">
            <Feed
              comments={comments}
              onAddComment={(text) => handleAddComment(text)}
              canAddComment={allowComment}
            />
          </div>
        )}

        {openStage && (
          <StagePanel
            stage={openStage}
            comments={openStageComments}
            canEdit={allowEditStages}
            canComment={allowComment}
            onClose={() => {
              setOpenStageId(null)
              setJustAddedStageId(null)
            }}
            onPatch={handleStagePatch}
            onAddComment={handleAddComment}
            onDelete={allowEditStages ? () => handleStageDelete(openStage.id) : undefined}
            onDeleteComment={handleDeleteComment}
            canDeleteComment={canDeleteComment}
            isNewStage={openStage.id === justAddedStageId}
          />
        )}
    </div>
  )
}
