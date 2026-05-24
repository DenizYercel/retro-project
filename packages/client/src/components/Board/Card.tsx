import { useState } from 'react'
import type { Card as CardType, RoomPhase } from '../../types'
import { useRoom } from '../../hooks/useRoom'
import { useRoomStore } from '../../store/roomStore'
import VoteButton from '../Voting/VoteButton'

interface Props {
  card: CardType
  phase: RoomPhase
}

export default function Card({ card, phase }: Props) {
  const { editCard, deleteCard, room } = useRoom()
  const myToken = useRoomStore((s) => s.myToken)
  const remainingVotes = useRoomStore((s) => s.remainingVotes)

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(card.content)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isHidden = card.content === '***'
  const showVotes = phase === 'REVEALED' || phase === 'VOTING' || phase === 'DONE'

  async function handleSaveEdit() {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === card.content) {
      setEditing(false)
      return
    }
    setSaving(true)
    editCard(card.id, trimmed, myToken)
    setSaving(false)
    setEditing(false)
  }

  function handleDelete() {
    if (confirmDelete) {
      deleteCard(card.id, myToken)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  if (isHidden) {
    return (
      <div className="bg-slate-100 rounded-lg p-3 border border-slate-200 animate-fade-in">
        <div className="flex items-start gap-2">
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-slate-300 rounded w-full" />
            <div className="h-3 bg-slate-300 rounded w-3/4" />
            <div className="h-3 bg-slate-300 rounded w-1/2" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2 italic">Düşünce yazılıyor...</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-3 transition-all duration-150 hover:shadow-md animate-fade-in ${
      card.isOwn ? 'ring-1 ring-blue-200' : ''
    }`}>
      {/* Card body */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="w-full text-sm text-slate-800 border border-slate-300 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            maxLength={500}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{editValue.length}/500</span>
            <div className="flex gap-2">
              <button
                className="btn-ghost text-xs px-2 py-1"
                onClick={() => {
                  setEditing(false)
                  setEditValue(card.content)
                }}
              >
                İptal
              </button>
              <button
                className="btn-primary text-xs px-2 py-1"
                onClick={handleSaveEdit}
                disabled={saving || !editValue.trim()}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
          {card.content}
        </p>
      )}

      {/* Footer */}
      {!editing && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {card.isOwn && (
              <span className="badge bg-slate-100 text-slate-600 text-xs">
                Senin kartın
              </span>
            )}
            {showVotes && card.voteCount > 0 && (
              <span className="badge bg-slate-100 text-slate-600 text-xs gap-1">
                <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd" />
                </svg>
                {card.voteCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Vote button in VOTING phase */}
            {phase === 'VOTING' && (
              <VoteButton
                cardId={card.id}
                myVotes={card.myVotes}
                isOwn={card.isOwn}
                remainingVotes={remainingVotes}
                roomId={room?.id ?? ''}
              />
            )}

            {/* Edit/Delete — only own cards in WRITING phase */}
            {card.isOwn && phase === 'WRITING' && (
              <>
                <button
                  className="btn-ghost p-1.5 text-slate-400 hover:text-blue-600"
                  onClick={() => setEditing(true)}
                  title="Düzenle"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  className={`btn-ghost p-1.5 ${confirmDelete ? 'text-red-600' : 'text-slate-400 hover:text-red-500'}`}
                  onClick={handleDelete}
                  title={confirmDelete ? 'Onaylamak için tekrar tıkla' : 'Sil'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
