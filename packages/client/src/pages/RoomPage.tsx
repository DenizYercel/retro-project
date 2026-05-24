import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useRoomStore } from '../store/roomStore'
import { useRoom } from '../hooks/useRoom'
import { useSession, hasJoinedRoom } from '../hooks/useSession'
import { useSocket } from '../hooks/useSocket'
import socket from '../lib/socket'
import JoinRoom from '../components/Room/JoinRoom'
import RoomHeader from '../components/Room/RoomHeader'
import ModeratorPanel from '../components/Room/ModeratorPanel'
import Board from '../components/Board/Board'
import RetroSummary from '../components/Room/RetroSummary'
import api from '../lib/api'

function Reconnecting() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <svg className="animate-spin w-10 h-10 text-primary-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-gray-500 text-sm">Odaya bağlanılıyor...</p>
      </div>
    </div>
  )
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { token, displayName } = useSession()
  const { isJoined, room } = useRoom()
  const store = useRoomStore()
  const hasAutoJoined = useRef(false)
  const hasFetched = useRef(false)

  useSocket()

  // Auto-join only if user has previously joined this specific room (F5 / tab restore)
  useEffect(() => {
    if (!roomId || !displayName || !hasJoinedRoom(roomId) || hasAutoJoined.current || isJoined) return
    hasAutoJoined.current = true
    store.setMyToken(token)
    store.setMyDisplayName(displayName)
    if (!socket.connected) socket.connect()
    socket.emit('join_room', { roomId, token, displayName })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, displayName])

  // REST fallback: hydrate store after socket room_state confirms join
  useEffect(() => {
    if (!isJoined || !roomId || hasFetched.current) return
    hasFetched.current = true

    api
      .get(`/rooms/${roomId}`, { params: { token } })
      .then((res) => {
        const data = res.data as {
          id: string; name: string; phase: string; expiresAt: string; isModerator: boolean
          participants: Parameters<typeof store.setParticipants>[0]
          columns: Parameters<typeof store.setColumns>[0]
          cards: Parameters<typeof store.setCards>[0]
          actionItems: Parameters<typeof store.setActionItems>[0]
          remainingVotes?: number
        }
        store.setRoom({ id: data.id, name: data.name, phase: data.phase as 'WRITING', expiresAt: data.expiresAt, isModerator: data.isModerator })
        store.setParticipants(data.participants)
        store.setColumns(data.columns ?? [])
        store.setCards(data.cards)
        store.setActionItems(data.actionItems)
        if (data.remainingVotes !== undefined) {
          store.setRemainingVotes(data.remainingVotes)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch room state', err)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoined, roomId])

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Geçersiz oda bağlantısı.</p>
      </div>
    )
  }

  // New visitor (never joined this room) → show join form
  if (!isJoined && !hasJoinedRoom(roomId)) {
    return <JoinRoom roomId={roomId} />
  }

  // Returning user (F5 / tab restore) → auto-joining, show spinner
  if (!isJoined) {
    return <Reconnecting />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <RoomHeader />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {room?.phase === 'DONE' ? <RetroSummary /> : <Board />}
        </div>
      </main>

      {room?.isModerator && <ModeratorPanel />}
    </div>
  )
}
