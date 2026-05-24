import { useState } from 'react'
import { useRoom } from '../../hooks/useRoom'
import { useRoomStore } from '../../store/roomStore'
import type { RoomPhase } from '../../types'

const TIMER_DURATIONS = [
  { label: '5 dk', value: 5 * 60 },
  { label: '10 dk', value: 10 * 60 },
  { label: '15 dk', value: 15 * 60 },
  { label: '25 dk', value: 25 * 60 },
]

export default function ModeratorPanel() {
  const { room, moderatorAction, startTimer } = useRoom()
  const myToken = useRoomStore((s) => s.myToken)
  const [selectedDuration, setSelectedDuration] = useState(TIMER_DURATIONS[1].value)
  const [loading, setLoading] = useState(false)

  if (!room) return null

  const phase: RoomPhase = room.phase
  const roomId = room.id

  async function handleAction(action: string, data?: Record<string, unknown>) {
    setLoading(true)
    try {
      moderatorAction(roomId, myToken, action, data)
    } finally {
      // Loading state reset when phase_changed event is received
      setTimeout(() => setLoading(false), 2000)
    }
  }

  function handleStartTimer() {
    startTimer(roomId, myToken, selectedDuration)
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Label */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-600">Moderatör Paneli</span>
          </div>

          {/* Phase-aware actions */}
          <div className="flex flex-wrap items-center gap-2">
            {phase === 'WRITING' && (
              <button
                className="btn-primary gap-2"
                onClick={() => handleAction('REVEAL_CARDS')}
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Kartları Aç
              </button>
            )}

            {phase === 'REVEALED' && (
              <>
                {/* Timer controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {TIMER_DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDuration(d.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        selectedDuration === d.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <button
                  className="btn-secondary gap-2"
                  onClick={handleStartTimer}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Zamanlayıcı Başlat
                </button>

                <button
                  className="btn-primary gap-2"
                  onClick={() => handleAction('START_VOTING')}
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Oylama Başlat
                </button>
              </>
            )}

            {phase === 'VOTING' && (
              <button
                className="btn-primary gap-2"
                onClick={() => handleAction('END_VOTING')}
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Oylamayı Bitir
              </button>
            )}

            {phase === 'DONE' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Retro Tamamlandı
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
