import { useState, useEffect, FormEvent } from 'react'
import { useRoomStore } from '../../store/roomStore'
import { useSession, markRoomJoined } from '../../hooks/useSession'
import api from '../../lib/api'
import socket from '../../lib/socket'

interface Props {
  roomId: string
}

export default function JoinRoom({ roomId }: Props) {
  const { token, setDisplayName } = useSession()
  const store = useRoomStore()

  const [nameInput, setNameInput] = useState('')
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    api
      .get<{ name: string }>(`/rooms/${roomId}`)
      .then((res) => setRoomName(res.data.name))
      .catch(() => setRoomName('Retrospektif'))
      .finally(() => setFetching(false))
  }, [roomId])

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    const name = nameInput.trim()
    if (!name) {
      setError('Lütfen bir isim girin.')
      return
    }
    if (name.length < 2) {
      setError('İsim en az 2 karakter olmalıdır.')
      return
    }
    setLoading(true)
    setError('')

    try {
      await api.post(`/rooms/${roomId}/join`, { token, displayName: name })

      setDisplayName(name)
      store.setMyToken(token)
      store.setMyDisplayName(name)
      markRoomJoined(roomId)

      if (!socket.connected) {
        socket.connect()
      }
      socket.emit('join_room', { roomId, token, displayName: name })

      store.setJoined(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Odaya katılınamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">VelaRetro</span>
          </div>

          {fetching ? (
            <div className="h-7 w-48 mx-auto bg-gray-200 rounded animate-pulse" />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{roomName}</h1>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Retroya katılmak için isminizi girin
          </p>
        </div>

        {/* Join card */}
        <div className="card p-8 shadow-lg">
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Görünen Ad
              </label>
              <input
                id="display-name"
                type="text"
                className="input text-base"
                placeholder="Adınızı girin..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={50}
                autoFocus
                disabled={loading}
              />
              {error && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Katılınıyor...
                </span>
              ) : (
                'Katıl'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400">
              Katılım anonim bir token ile gerçekleşir. Herhangi bir hesap gerekmez.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <a href="/" className="hover:text-gray-600 transition-colors">Ana Sayfaya Dön</a>
        </p>
      </div>
    </div>
  )
}
