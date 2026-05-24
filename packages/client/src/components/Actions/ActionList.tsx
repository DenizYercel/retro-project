import { useState, FormEvent } from 'react'
import { useRoom } from '../../hooks/useRoom'
import { useRoomStore } from '../../store/roomStore'
import ActionItemComponent from './ActionItem'
import api from '../../lib/api'

export default function ActionList() {
  const { actionItems, room, participants } = useRoom()
  const myToken = useRoomStore((s) => s.myToken)

  const [newContent, setNewContent] = useState('')
  const [assignee, setAssignee] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!room) return null

  const completed = actionItems.filter((a) => a.completed)
  const pending = actionItems.filter((a) => !a.completed)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const content = newContent.trim()
    if (!content) {
      setError('Aksiyon içeriği boş olamaz.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await api.post(`/rooms/${room!.id}/actions`, {
        content,
        assignee: assignee || undefined,
        token: myToken,
      })
      setNewContent('')
      setAssignee('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aksiyon eklenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Pending items */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Bekleyen ({pending.length})
          </h3>
          {pending.map((item) => (
            <ActionItemComponent key={item.id} item={item} roomId={room.id} />
          ))}
        </div>
      )}

      {/* Completed items */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Tamamlanan ({completed.length})
          </h3>
          {completed.map((item) => (
            <ActionItemComponent key={item.id} item={item} roomId={room.id} />
          ))}
        </div>
      )}

      {actionItems.length === 0 && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Henüz aksiyon maddesi yok.</p>
          <p className="text-xs text-gray-400 mt-1">Aşağıdan yeni bir aksiyon ekleyin.</p>
        </div>
      )}

      {/* Add action form */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Aksiyon Ekle</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <input
              type="text"
              className="input"
              placeholder="Aksiyon açıklaması..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              maxLength={300}
              disabled={submitting}
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <select
                className="input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                disabled={submitting}
              >
                <option value="">Sorumlu seçin (isteğe bağlı)</option>
                {participants.map((p) => (
                  <option key={p.displayName} value={p.displayName}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary flex-shrink-0"
              disabled={submitting || !newContent.trim()}
            >
              {submitting ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                'Ekle'
              )}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600" role="alert">{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}
