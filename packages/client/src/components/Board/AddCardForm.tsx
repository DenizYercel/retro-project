import { useState, FormEvent, KeyboardEvent } from 'react'
import { useRoom } from '../../hooks/useRoom'
import { useRoomStore } from '../../store/roomStore'

const MAX_CHARS = 500

interface Props {
  columnId: string
}

export default function AddCardForm({ columnId }: Props) {
  const { addCard, room } = useRoom()
  const myToken = useRoomStore((s) => s.myToken)
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || !room) return

    setSubmitting(true)
    addCard(room.id, columnId, trimmed, myToken)
    setValue('')
    setSubmitting(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const remaining = MAX_CHARS - value.length
  const isOverLimit = remaining < 0
  const isNearLimit = remaining <= 50 && !isOverLimit

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          className={`w-full px-3 py-2 text-sm border rounded-lg resize-none transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white placeholder-gray-400 ${
            isOverLimit ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
          }`}
          rows={3}
          placeholder="Düşüncenizi yazın... (Ctrl+Enter ile ekle)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitting}
          aria-label="Kart içeriği"
        />
        <div className={`absolute bottom-2 right-2 text-xs font-mono ${
          isOverLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-gray-300'
        }`}>
          {remaining}
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full text-sm"
        disabled={!value.trim() || submitting || isOverLimit}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Ekleniyor...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ekle
          </span>
        )}
      </button>
    </form>
  )
}
