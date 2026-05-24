import { useState, useCallback } from 'react'

const TOKEN_KEY = 'retro_token'
const NAME_KEY = 'retro_name'
const JOINED_ROOMS_KEY = 'retro_joined_rooms'

function getOrCreateToken(): string {
  const existing = localStorage.getItem(TOKEN_KEY)
  if (existing) return existing
  const newToken = crypto.randomUUID()
  localStorage.setItem(TOKEN_KEY, newToken)
  return newToken
}

export function markRoomJoined(roomId: string) {
  try {
    const stored = localStorage.getItem(JOINED_ROOMS_KEY)
    const rooms: string[] = stored ? JSON.parse(stored) : []
    if (!rooms.includes(roomId)) {
      rooms.push(roomId)
      localStorage.setItem(JOINED_ROOMS_KEY, JSON.stringify(rooms))
    }
  } catch {
    // ignore
  }
}

export function hasJoinedRoom(roomId: string): boolean {
  try {
    const stored = localStorage.getItem(JOINED_ROOMS_KEY)
    const rooms: string[] = stored ? JSON.parse(stored) : []
    return rooms.includes(roomId)
  } catch {
    return false
  }
}

export function useSession() {
  const [token] = useState<string>(() => getOrCreateToken())
  const [displayName, setDisplayNameState] = useState<string>(
    () => localStorage.getItem(NAME_KEY) ?? ''
  )

  const setDisplayName = useCallback((name: string) => {
    localStorage.setItem(NAME_KEY, name)
    setDisplayNameState(name)
  }, [])

  return { token, displayName, setDisplayName }
}
