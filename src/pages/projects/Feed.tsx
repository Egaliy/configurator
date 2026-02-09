import { useState, useRef } from 'react'
import type { Comment } from './mockData'
import { formatCommentDate } from './mockData'

interface FeedProps {
  comments: Comment[]
  onAddComment: (text: string) => void
  canAddComment?: boolean
}

export default function Feed({ comments, onAddComment, canAddComment = true }: FeedProps) {
  const [newText, setNewText] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newText.trim()
    if (trimmed) {
      onAddComment(trimmed)
      setNewText('')
      setAttachedFiles([])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.length) setAttachedFiles((prev) => [...prev, ...Array.from(files)])
    e.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-normal heading-large mb-6">Feed</h2>

      {canAddComment && (
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative mb-4">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full px-4 py-3 pr-12 bg-transparent border border-white/10 hover:border-white/20 rounded-lg text-white focus:outline-none focus:border-white transition-colors tracking-tighter resize-none placeholder:text-white/60"
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-3 bottom-3 w-9 h-9 rounded-lg border border-white/20 hover:border-white/40 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            title="Attach screenshot or file"
          >
            <span className="text-xl leading-none">+</span>
          </button>
        </div>
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {attachedFiles.map((file, i) => (
              <span
                key={`${file.name}-${i}`}
                className="inline-flex items-center gap-2 px-2 py-1 rounded border border-white/10 text-sm tracking-tighter"
              >
                {file.name}
                <button type="button" onClick={() => removeAttachment(i)} className="opacity-60 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
        )}
        <button
          type="submit"
          className="px-6 py-3 bg-white text-black rounded-lg hover:opacity-90 transition-opacity tracking-tighter text-base"
        >
          Send comment
        </button>
      </form>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm md:text-base opacity-60 tracking-tighter">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="border border-white/10 rounded-lg p-4 md:p-5"
            >
              <div className="flex flex-wrap items-baseline gap-2 mb-2">
                <span className="text-base tracking-tighter">{c.author}</span>
                <span className="text-xs md:text-sm opacity-50 tracking-tighter">
                  {formatCommentDate(c.createdAt)}
                </span>
              </div>
              <p className="text-sm md:text-base opacity-90 tracking-tighter">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
