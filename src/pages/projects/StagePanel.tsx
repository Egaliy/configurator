import { useState, useEffect, useRef, useCallback } from 'react'
import type { Stage, Comment } from './mockData'
import { formatCommentDate } from './mockData'

type PendingAttachment = { id: string; name: string; type: 'image' | 'file'; dataUrl: string }

interface StagePanelProps {
  stage: Stage
  comments: Comment[]
  canEdit: boolean
  canComment: boolean
  onClose: () => void
  onPatch: (stageId: string, patch: Partial<Pick<Stage, 'description' | 'name'>>) => void
  onAddComment: (text: string, stageId: string, attachments?: { name: string; type: 'image' | 'file'; dataUrl: string }[]) => void
  /** Delete stage (link shown only when canEdit) */
  onDelete?: () => void
  /** Delete a comment (admin: any, client: own only) */
  onDeleteComment?: (commentId: string) => void
  canDeleteComment?: (comment: Comment) => boolean
  /** Just created: focus name input and select "New stage" */
  isNewStage?: boolean
}

export default function StagePanel({
  stage,
  comments,
  canEdit,
  canComment,
  onClose,
  onPatch,
  onAddComment,
  onDelete,
  onDeleteComment,
  canDeleteComment,
  isNewStage,
}: StagePanelProps) {
  const [description, setDescription] = useState(stage.description ?? '')
  const [name, setName] = useState(stage.name)
  const [newComment, setNewComment] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const isDirty = (stage.description ?? '') !== description
  const isNameDirty = stage.name !== name

  const fileToDataUrl = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(file)
    })
  }, [])

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      const newOnes: PendingAttachment[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const type = file.type.startsWith('image/') ? 'image' : 'file'
        try {
          const dataUrl = await fileToDataUrl(file)
          newOnes.push({
            id: `pending-${Date.now()}-${i}`,
            name: file.name,
            type,
            dataUrl,
          })
        } catch {
          // skip failed
        }
      }
      setPendingAttachments((prev) => [...prev, ...newOnes])
    },
    [fileToDataUrl]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items?.length) return
      const file = Array.from(items).find((item) => item.kind === 'file')?.getAsFile()
      if (file && file.type.startsWith('image/')) {
        e.preventDefault()
        addFiles([file] as unknown as FileList)
      }
    },
    [addFiles]
  )

  useEffect(() => {
    setName(stage.name)
  }, [stage.id, stage.name])

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  useEffect(() => {
    if (!isNewStage || !mounted || !canEdit) return
    const t = setTimeout(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }, 220)
    return () => clearTimeout(t)
  }, [isNewStage, mounted, canEdit])

  const handleSaveDescription = () => {
    if (!isDirty) return
    onPatch(stage.id, { description })
  }

  const handleSaveName = () => {
    if (!isNameDirty) return
    if (!name.trim()) {
      setName(stage.name)
      return
    }
    onPatch(stage.id, { name: name.trim() })
  }

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newComment.trim()
    if (trimmed || pendingAttachments.length > 0) {
      onAddComment(
        trimmed,
        stage.id,
        pendingAttachments.length
          ? pendingAttachments.map((a) => ({ name: a.name, type: a.type, dataUrl: a.dataUrl }))
          : undefined
      )
      setNewComment('')
      setPendingAttachments([])
    }
    fileInputRef.current?.value && (fileInputRef.current.value = '')
  }

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-200 ${mounted ? 'bg-black/70 opacity-100' : 'bg-black/70 opacity-0'}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-black border-l border-white/10 z-40 flex flex-col shadow-2xl transition-transform duration-200 ease-out"
        style={{ transform: mounted ? 'translateX(0)' : 'translateX(100%)' }}
        role="dialog"
        aria-label={`Stage: ${stage.name}`}
      >
        <div className="p-6 flex-shrink-0 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {canEdit ? (
              <>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget.blur(), e.preventDefault())}
                  className="w-full text-2xl md:text-3xl font-normal heading-large tracking-tighter bg-transparent border-0 border-b border-transparent hover:border-white/20 focus:border-white/40 focus:outline-none pb-1 transition-colors text-white caret-white"
                  placeholder="Stage name"
                  aria-label="Stage name"
                />
                {isNameDirty && (
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="mt-1 text-sm text-white/60 hover:text-white tracking-tighter underline underline-offset-2"
                  >
                    Save name
                  </button>
                )}
              </>
            ) : (
              <h2 className="text-2xl md:text-3xl font-normal heading-large tracking-tighter">
                {stage.name}
              </h2>
            )}
            <p className="text-sm text-white/60 tracking-tighter mt-1">
              {stage.startDate} – {stage.endDate}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white tracking-tighter transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {onDelete && (
            <p className="text-sm">
              <button
                type="button"
                onClick={onDelete}
                className="text-red-400 hover:text-red-300 tracking-tighter underline underline-offset-2"
              >
                Delete stage
              </button>
            </p>
          )}
          <section>
            <h3 className="text-sm text-white/60 tracking-tighter mb-2">Description</h3>
            {canEdit ? (
              <>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add stage description..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder:text-white/40 tracking-tighter resize-none focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                {isDirty && (
                  <button
                    type="button"
                    onClick={handleSaveDescription}
                    className="mt-2 px-4 py-2 rounded-lg bg-white text-black text-sm tracking-tighter hover:opacity-90"
                  >
                    Save
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm md:text-base text-white/90 tracking-tighter whitespace-pre-wrap">
                {stage.description || 'No description yet.'}
              </p>
            )}
          </section>

          <section>
            <h3 className="text-sm text-white/60 tracking-tighter mb-3">Comments</h3>
            {canComment && (
              <form onSubmit={handleSubmitComment} className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Add a comment... Paste or attach screenshot/file."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder:text-white/40 tracking-tighter resize-none focus:outline-none focus:ring-1 focus:ring-white/20 text-sm"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,*/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm tracking-tighter hover:bg-white/20"
                  >
                    Attach screenshot or file
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm tracking-tighter hover:bg-white/30"
                  >
                    Send
                  </button>
                </div>
                {pendingAttachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pendingAttachments.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1.5 text-sm"
                      >
                        {a.type === 'image' ? (
                          <img
                            src={a.dataUrl}
                            alt=""
                            className="h-8 w-8 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <span className="text-white/70 truncate max-w-[8rem]" title={a.name}>
                            {a.name}
                          </span>
                        )}
                        {a.type === 'image' && (
                          <span className="text-white/60 truncate max-w-[6rem]" title={a.name}>
                            {a.name}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePendingAttachment(a.id)}
                          className="text-white/60 hover:text-white ml-0.5"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            )}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-white/50 tracking-tighter">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-white/5 p-3">
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                      <span className="text-sm tracking-tighter">{c.author}</span>
                      <span className="text-xs text-white/50 tracking-tighter">
                        {formatCommentDate(c.createdAt)}
                      </span>
                      {onDeleteComment && canDeleteComment?.(c) && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(c.id)}
                          className="ml-auto text-xs text-white/50 hover:text-red-400 tracking-tighter"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    {c.text && <p className="text-sm text-white/90 tracking-tighter">{c.text}</p>}
                    {c.attachments && c.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {c.attachments.map((att) =>
                          att.type === 'image' ? (
                            <a
                              key={att.id}
                              href={att.dataUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded overflow-hidden border border-white/10 hover:border-white/20"
                            >
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="max-h-40 max-w-full object-contain"
                              />
                            </a>
                          ) : (
                            <a
                              key={att.id}
                              href={att.dataUrl}
                              download={att.name}
                              className="text-sm text-white/70 hover:text-white underline underline-offset-2 truncate max-w-[12rem]"
                            >
                              {att.name}
                            </a>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </aside>
    </>
  )
}
