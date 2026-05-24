import { useState } from 'react'
import { useRoom } from '../../hooks/useRoom'
import CountdownTimer from '../Timer/CountdownTimer'
import type { RoomPhase } from '../../types'

const phaseLabels: Record<RoomPhase, string> = {
  WRITING: 'Yazma',
  REVEALED: 'İnceleme',
  VOTING: 'Oylama',
  DONE: 'Tamamlandı',
}

const phaseStyles: Record<RoomPhase, string> = {
  WRITING: 'bg-slate-100 text-slate-600',
  REVEALED: 'bg-yellow-100 text-yellow-800',
  VOTING: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const avatarColors = [
  'bg-indigo-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-teal-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

export default function RoomHeader() {
  const { room, participants, timer } = useRoom()
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!room) return null

  const visibleParticipants = participants.slice(0, 5)
  const overflowCount = Math.max(0, participants.length - 5)

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: logo + room name */}
          <div className="flex items-center gap-3 min-w-0">
            <a href="/" className="flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </a>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                {room.name}
              </h1>
            </div>

            {/* Phase badge */}
            <span className={`badge flex-shrink-0 ${phaseStyles[room.phase]}`}>
              {phaseLabels[room.phase]}
            </span>
          </div>

          {/* Right: timer + participants + copy */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Timer */}
            {timer.active && (
              <CountdownTimer remaining={timer.remaining} />
            )}

            {/* Participants */}
            <div className="hidden sm:flex items-center">
              <div className="flex -space-x-2">
                {visibleParticipants.map((p) => (
                  <div
                    key={p.displayName}
                    title={p.displayName}
                    className={`w-8 h-8 rounded-full ${getAvatarColor(p.displayName)} flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white`}
                  >
                    {getInitials(p.displayName)}
                  </div>
                ))}
                {overflowCount > 0 && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-semibold ring-2 ring-white">
                    +{overflowCount}
                  </div>
                )}
              </div>
              <span className="ml-2 text-sm text-slate-500">
                {participants.length} kişi
              </span>
            </div>

            {/* Copy link */}
            <button
              onClick={handleCopy}
              className="btn-secondary text-xs gap-1.5 hidden sm:inline-flex"
              title="Odaya davet bağlantısını kopyala"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600">Kopyalandı!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Linki Kopyala
                </>
              )}
            </button>

            {/* Mobile: icon only copy */}
            <button
              onClick={handleCopy}
              className="btn-ghost sm:hidden p-2"
              title="Linki Kopyala"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
