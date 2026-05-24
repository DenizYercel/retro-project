import { create } from 'zustand'
import type {
  Room,
  Participant,
  Card,
  ActionItem,
  BoardColumn,
  RoomPhase,
} from '../types'

interface RoomStore {
  room: Room | null
  participants: Participant[]
  columns: BoardColumn[]
  cards: Card[]
  actionItems: ActionItem[]
  myToken: string
  myDisplayName: string
  remainingVotes: number
  timer: { active: boolean; remaining: number }
  isJoined: boolean

  // Setters
  setRoom: (room: Room) => void
  setParticipants: (participants: Participant[]) => void
  setColumns: (columns: BoardColumn[]) => void
  addColumn: (column: BoardColumn) => void
  setCards: (cards: Card[]) => void
  setActionItems: (actionItems: ActionItem[]) => void
  setMyToken: (token: string) => void
  setMyDisplayName: (name: string) => void
  setRemainingVotes: (votes: number) => void
  setJoined: (joined: boolean) => void
  setTimer: (timer: { active: boolean; remaining: number }) => void

  // Card actions
  addCard: (card: Card) => void
  updateCard: (card: Card) => void
  deleteCard: (cardId: string) => void

  // Phase
  setPhase: (phase: RoomPhase, cards?: Card[]) => void

  // Voting
  castVote: (cardId: string, myVotes: number, voteCount: number, remainingVotes: number) => void
  retractVote: (cardId: string, myVotes: number, voteCount: number, remainingVotes: number) => void

  // Action items
  addActionItem: (item: ActionItem) => void
  updateActionItem: (item: ActionItem) => void

  // Timer
  tickTimer: (remaining: number) => void

  // Reset
  reset: () => void
}

const initialState = {
  room: null,
  participants: [],
  columns: [],
  cards: [],
  actionItems: [],
  myToken: '',
  myDisplayName: '',
  remainingVotes: 5,
  timer: { active: false, remaining: 0 },
  isJoined: false,
}

export const useRoomStore = create<RoomStore>((set) => ({
  ...initialState,

  setRoom: (room) => set({ room }),

  setParticipants: (participants) => set({ participants }),

  setColumns: (columns) => set({ columns }),

  addColumn: (column) =>
    set((state) => ({
      columns: [...state.columns, column].sort((a, b) => a.order - b.order),
    })),

  setCards: (cards) => set({ cards }),

  setActionItems: (actionItems) => set({ actionItems }),

  setMyToken: (token) => set({ myToken: token }),

  setMyDisplayName: (name) => set({ myDisplayName: name }),

  setRemainingVotes: (votes) => set({ remainingVotes: votes }),

  setJoined: (joined) => set({ isJoined: joined }),

  setTimer: (timer) => set({ timer }),

  addCard: (card) =>
    set((state) => ({
      cards: [...state.cards, card],
    })),

  updateCard: (card) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === card.id ? card : c)),
    })),

  deleteCard: (cardId) =>
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== cardId),
    })),

  setPhase: (phase, cards) =>
    set((state) => ({
      room: state.room ? { ...state.room, phase } : null,
      cards: cards ?? state.cards,
    })),

  castVote: (cardId, myVotes, voteCount, remainingVotes) =>
    set((state) => ({
      remainingVotes,
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, myVotes, voteCount } : c
      ),
    })),

  retractVote: (cardId, myVotes, voteCount, remainingVotes) =>
    set((state) => ({
      remainingVotes,
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, myVotes, voteCount } : c
      ),
    })),

  addActionItem: (item) =>
    set((state) => ({
      actionItems: [...state.actionItems, item],
    })),

  updateActionItem: (item) =>
    set((state) => ({
      actionItems: state.actionItems.map((a) => (a.id === item.id ? item : a)),
    })),

  tickTimer: (remaining) =>
    set((state) => ({
      timer: { ...state.timer, remaining },
    })),

  reset: () => set(initialState),
}))
