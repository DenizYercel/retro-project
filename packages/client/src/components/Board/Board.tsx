import { useState } from 'react'
import { useRoom } from '../../hooks/useRoom'
import { useRoomStore } from '../../store/roomStore'
import Column from './Column'

// Icons for the 4 default DAKI columns (by order)
const DEFAULT_ICONS = [
  <svg key="keep" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg key="drop" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>,
  <svg key="add" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  <svg key="improve" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>,
]

const CUSTOM_ICON = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Board() {
  const { columns, cards, room, addColumn } = useRoom()
  const myToken = useRoomStore((s) => s.myToken)
  const [showAddCol, setShowAddCol] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [adding, setAdding] = useState(false)

  if (!room) return null

  function handleAddColumn() {
    const name = newColName.trim()
    if (!name) return
    setAdding(true)
    addColumn(room!.id, myToken, name)
    setNewColName('')
    setAdding(false)
    setShowAddCol(false)
  }

  function handleCSV() {
    const rows: string[] = [
      'Oda,' + room!.name,
      'Tarih,' + new Date().toLocaleDateString('tr-TR'),
      'Aşama,' + room!.phase,
      '',
      'Sütun,İçerik,Oy Sayısı',
    ]
    for (const col of columns) {
      const colCards = cards.filter((c) => c.columnId === col.id)
      for (const card of colCards) {
        const content = card.content.replace(/"/g, '""')
        rows.push(`"${col.name}","${content}",${card.voteCount}`)
      }
    }
    downloadCSV(rows.join('\n'), `retro-${room!.name.replace(/\s+/g, '-')}.csv`)
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-400 font-medium">{columns.length} sütun · {cards.length} kart</p>
        <button
          onClick={handleCSV}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV İndir
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {columns.map((col) => {
          const icon = col.isDefault
            ? (DEFAULT_ICONS[col.order] ?? CUSTOM_ICON)
            : CUSTOM_ICON
          return (
            <Column
              key={col.id}
              columnId={col.id}
              title={col.name}
              color={col.color}
              icon={icon}
              cards={cards.filter((c) => c.columnId === col.id)}
              phase={room.phase}
            />
          )
        })}

        {/* Add Column — moderator only, WRITING phase */}
        {room.isModerator && room.phase === 'WRITING' && (
          <div className="flex flex-col rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden min-h-[220px]">
            {showAddCol ? (
              <div className="flex-1 flex flex-col gap-3 p-4">
                <p className="text-sm font-semibold text-gray-700">Yeni Sütun</p>
                <input
                  autoFocus
                  type="text"
                  className="input text-sm"
                  placeholder="Sütun adı..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                  maxLength={40}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddColumn}
                    disabled={!newColName.trim() || adding}
                    className="btn-primary text-sm flex-1"
                  >
                    Ekle
                  </button>
                  <button
                    onClick={() => { setShowAddCol(false); setNewColName('') }}
                    className="btn-secondary text-sm"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCol(true)}
                className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">Sütun Ekle</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
