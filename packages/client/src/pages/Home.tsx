import { useState, FormEvent } from 'react'

const TEMPLATES = [
  {
    id: 'daki',
    name: 'DAKI',
    desc: 'Drop, Add, Keep, Improve',
    columns: ['Keep', 'Drop', 'Add', 'Improve'],
    colors: ['#0f766e', '#be123c', '#1d4ed8', '#b45309'],
  },
  {
    id: 'start_stop_continue',
    name: 'Start / Stop / Continue',
    desc: 'Klasik retrospektif formatı',
    columns: ['Start', 'Stop', 'Continue'],
    colors: ['#1d4ed8', '#be123c', '#0f766e'],
  },
  {
    id: 'mad_sad_glad',
    name: 'Mad / Sad / Glad',
    desc: 'Duygusal retrospektif',
    columns: ['Mad', 'Sad', 'Glad'],
    colors: ['#be123c', '#b45309', '#0f766e'],
  },
  {
    id: 'four_ls',
    name: '4Ls',
    desc: 'Liked, Learned, Lacked, Longed For',
    columns: ['Liked', 'Learned', 'Lacked', 'Longed For'],
    colors: ['#0f766e', '#1d4ed8', '#be123c', '#b45309'],
  },
  {
    id: 'www_ebi',
    name: 'WWW / EBI',
    desc: 'What Went Well & Even Better If',
    columns: ['What Went Well', 'Even Better If'],
    colors: ['#0f766e', '#1d4ed8'],
  },
]
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useSession, markRoomJoined } from '../hooks/useSession'
import { useRoomStore } from '../store/roomStore'
import socket from '../lib/socket'

export default function Home() {
  const navigate = useNavigate()
  const { token, displayName, setDisplayName } = useSession()
  const store = useRoomStore()

  const [roomName, setRoomName] = useState('')
  const [moderatorName, setModeratorName] = useState(displayName)
  const [selectedTemplate, setSelectedTemplate] = useState('daki')
  const [joinInput, setJoinInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [joinError, setJoinError] = useState('')

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!roomName.trim()) {
      setCreateError('Oda adı boş olamaz.')
      return
    }
    if (!moderatorName.trim()) {
      setCreateError('Adınızı girmelisiniz.')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const name = moderatorName.trim()
      setDisplayName(name)
      store.setMyToken(token)
      store.setMyDisplayName(name)

      const res = await api.post<{ id: string; name: string; phase: string; expiresAt: string }>('/rooms', {
        name: roomName.trim(),
        moderatorToken: token,
        moderatorName: name,
        template: selectedTemplate,
      })

      // Moderatörü otomatik katılmış say — JoinRoom'u atla
      store.setRoom({ id: res.data.id, name: res.data.name, phase: res.data.phase as 'WRITING', expiresAt: res.data.expiresAt, isModerator: true })
      store.setJoined(true)
      markRoomJoined(res.data.id)

      // Socket bağlantısı kur ve odaya katıl
      if (!socket.connected) socket.connect()
      socket.emit('join_room', { roomId: res.data.id, token, displayName: name })

      navigate(`/room/${res.data.id}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Oda oluşturulamadı.')
    } finally {
      setCreating(false)
    }
  }

  function handleJoin(e: FormEvent) {
    e.preventDefault()
    setJoinError('')
    const input = joinInput.trim()
    if (!input) {
      setJoinError('Oda bağlantısı veya kimliği boş olamaz.')
      return
    }

    let roomId = input
    try {
      const url = new URL(input)
      const parts = url.pathname.split('/')
      const roomIndex = parts.indexOf('room')
      if (roomIndex !== -1 && parts[roomIndex + 1]) {
        roomId = parts[roomIndex + 1]
      }
    } catch {
      // Not a URL, treat as room ID directly
    }

    if (!roomId) {
      setJoinError('Geçerli bir oda bağlantısı veya kimliği girin.')
      return
    }

    navigate(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19V5l-8 10h8m0-10l8 10h-8" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">VelaRetro</span>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Ekibinizle{' '}
            <span className="text-blue-600">retrospektif</span>{' '}
            yapın
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Gerçek zamanlı retrospektif panosu ile ekibinizin güçlü yönlerini ve
            iyileştirme alanlarını birlikte keşfedin.
          </p>
        </div>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Room */}
          <div className="card p-8">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Yeni Retro Oluştur</h2>
              <p className="text-sm text-slate-500">
                Yeni bir retrospektif odası açın ve ekibinizi davet edin.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Şablon
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        selectedTemplate === t.id
                          ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex gap-1 flex-shrink-0">
                        {t.colors.map((c, i) => (
                          <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{t.name}</p>
                        <p className="text-xs text-slate-500 truncate">{t.desc}</p>
                      </div>
                      {selectedTemplate === t.id && (
                        <svg className="w-4 h-4 text-slate-900 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="moderator-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Adınız
                </label>
                <input
                  id="moderator-name"
                  type="text"
                  className="input"
                  placeholder="Adınızı girin"
                  value={moderatorName}
                  onChange={(e) => setModeratorName(e.target.value)}
                  maxLength={50}
                  disabled={creating}
                />
              </div>
              <div>
                <label htmlFor="room-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Oda Adı
                </label>
                <input
                  id="room-name"
                  type="text"
                  className="input"
                  placeholder="Q1 Sprint Retrospektifi"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={100}
                  disabled={creating}
                />
                {createError && (
                  <p className="mt-1 text-xs text-red-600" role="alert">{createError}</p>
                )}
              </div>
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={creating}
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Oluşturuluyor...
                  </span>
                ) : (
                  'Oluştur'
                )}
              </button>
            </form>
          </div>

          {/* Join Room */}
          <div className="card p-8">
            <div className="mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Var Olan Odaya Katıl</h2>
              <p className="text-sm text-slate-500">
                Paylaşılan bağlantı veya oda kimliği ile mevcut bir retroya katılın.
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label htmlFor="join-input" className="block text-sm font-medium text-slate-700 mb-1">
                  Oda Bağlantısı veya Kimliği
                </label>
                <input
                  id="join-input"
                  type="text"
                  className="input"
                  placeholder="https://... veya oda-kimliği"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                />
                {joinError && (
                  <p className="mt-1 text-xs text-red-600" role="alert">{joinError}</p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full">
                Katıl
              </button>
            </form>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              ),
              title: 'Gerçek Zamanlı',
              desc: 'Tüm değişiklikler anında tüm katılımcılara yansır.',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              ),
              title: 'Anonim Yazma',
              desc: 'Yazma aşamasında kartlar diğerlerine görünmez.',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5l7 7-7 7" />
              ),
              title: 'Yapılandırılmış Süreç',
              desc: 'Yazma, açıklama, oylama ve aksiyonlar — adım adım.',
            },
          ].map((f, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {f.icon}
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-slate-400">
        VelaRetro — Yelken aç, sprint'i geride bırak
      </footer>
    </div>
  )
}
