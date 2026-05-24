import { useState } from 'react'
import { useRoom } from '../../hooks/useRoom'
import { useRoomStore } from '../../store/roomStore'
import ActionItemComponent from '../Actions/ActionItem'
import api from '../../lib/api'
import type { FormEvent } from 'react'

export default function RetroSummary() {
  const { room, columns, cards, actionItems, participants } = useRoom()
  const myToken = useRoomStore((s) => s.myToken)

  const [newContent, setNewContent] = useState('')
  const [assignee, setAssignee] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState('')
  const [copied, setCopied] = useState(false)

  if (!room) return null

  const totalVotes = cards.reduce((sum, c) => sum + c.voteCount, 0)
  const topCards = [...cards].sort((a, b) => b.voteCount - a.voteCount).slice(0, 5).filter(c => c.voteCount > 0)
  const pending = actionItems.filter((a) => !a.completed)
  const completed = actionItems.filter((a) => a.completed)

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleAddAction(e: FormEvent) {
    e.preventDefault()
    const content = newContent.trim()
    if (!content) return
    setAddError('')
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
      setAddError(err instanceof Error ? err.message : 'Aksiyon eklenemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-900">Retro Tamamlandı</h2>
            <p className="text-sm text-green-700 mt-0.5">{room.name}</p>
          </div>
        </div>
        <button onClick={handleCopy} className="btn-secondary text-sm gap-2 self-start sm:self-auto">
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-600">Kopyalandı!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Linki Paylaş
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Katılımcı', value: participants.length },
          { label: 'Kart', value: cards.length },
          { label: 'Oy', value: totalVotes },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top voted cards */}
      {topCards.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">En Çok Oy Alan Kartlar</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {topCards.map((card, i) => {
              const col = columns.find((c) => c.id === card.columnId)
              return (
                <div key={card.id} className="px-6 py-4 flex items-center gap-4">
                  <span className="text-lg font-bold text-slate-300 w-6 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 truncate">{card.content}</p>
                    {col && (
                      <span
                        className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: col.color + '22', color: col.color }}
                      >
                        {col.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-bold text-slate-700">{card.voteCount}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Columns summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {columns.map((col) => {
          const colCards = [...cards]
            .filter((c) => c.columnId === col.id)
            .sort((a, b) => b.voteCount - a.voteCount)
          if (colCards.length === 0) return null
          return (
            <div key={col.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ backgroundColor: col.color + '18' }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: col.color }}
                />
                <h4 className="text-sm font-bold" style={{ color: col.color }}>{col.name}</h4>
                <span className="ml-auto text-xs font-medium text-slate-500">{colCards.length} kart</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {colCards.map((card) => (
                  <li key={card.id} className="px-4 py-2.5 flex items-center gap-3">
                    <span className="flex-1 text-sm text-slate-700 truncate">{card.content}</span>
                    {card.voteCount > 0 && (
                      <span className="text-xs font-semibold text-amber-600 flex-shrink-0">
                        ★ {card.voteCount}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Action items */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Aksiyon Maddeleri</h3>
          <p className="text-xs text-slate-500 mt-0.5">Retro sonucunda belirlenen aksiyonlar</p>
        </div>
        <div className="p-6 space-y-4">
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bekleyen ({pending.length})</p>
              {pending.map((item) => (
                <ActionItemComponent key={item.id} item={item} roomId={room.id} />
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tamamlanan ({completed.length})</p>
              {completed.map((item) => (
                <ActionItemComponent key={item.id} item={item} roomId={room.id} />
              ))}
            </div>
          )}
          {actionItems.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Henüz aksiyon maddesi yok.</p>
          )}

          {/* Add action */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-700 mb-3">Aksiyon Ekle</p>
            <form onSubmit={handleAddAction} className="space-y-2">
              <input
                type="text"
                className="input"
                placeholder="Aksiyon açıklaması..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                maxLength={300}
                disabled={submitting}
              />
              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Sorumlu seçin (isteğe bağlı)</option>
                  {participants.map((p) => (
                    <option key={p.displayName} value={p.displayName}>{p.displayName}</option>
                  ))}
                </select>
                <button type="submit" className="btn-primary flex-shrink-0" disabled={submitting || !newContent.trim()}>
                  Ekle
                </button>
              </div>
              {addError && <p className="text-xs text-red-600">{addError}</p>}
            </form>
          </div>
        </div>
      </div>

    </div>
  )
}
