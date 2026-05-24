export type RoomPhase = 'WRITING' | 'REVEALED' | 'VOTING' | 'DONE'

export interface BoardColumn {
  id: string
  roomId: string
  name: string
  color: string
  order: number
  isDefault: boolean
}

export interface Room {
  id: string
  name: string
  phase: RoomPhase
  expiresAt: string
  isModerator: boolean
}

export interface Participant {
  displayName: string
}

export interface Card {
  id: string
  columnId: string
  content: string
  voteCount: number
  myVotes: number
  isOwn: boolean
}

export interface ActionItem {
  id: string
  content: string
  assignee?: string
  completed: boolean
}

// Socket event payloads

export interface PhaseChangedPayload {
  phase: RoomPhase
  cards?: Card[]
}

export interface VoteUpdatedPayload {
  cardId: string
  voteCount: number
}

export interface MyVotesUpdatedPayload {
  cardId: string
  myVotes: number
  remainingVotes: number
}

export interface TimerTickPayload {
  remaining: number
}
