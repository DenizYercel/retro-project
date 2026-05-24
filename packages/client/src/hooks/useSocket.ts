import { useEffect } from 'react'
import socket from '../lib/socket'
import { useRoomStore } from '../store/roomStore'
import type {
  Room,
  Participant,
  Card,
  ActionItem,
  BoardColumn,
  PhaseChangedPayload,
  VoteUpdatedPayload,
  MyVotesUpdatedPayload,
  TimerTickPayload,
} from '../types'

function getStore() {
  return useRoomStore.getState()
}

// Sunucu room_state'i düz yapıda gönderiyor (room nested değil)
type ServerRoomState = Room & {
  participants: Participant[]
  columns: BoardColumn[]
  cards: Card[]
  actionItems: ActionItem[]
  remainingVotes?: number
  timer?: { active: boolean; remaining: number }
}

export function useSocket() {
  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    function onRoomState(payload: ServerRoomState) {
      const s = getStore()
      s.setRoom({
        id: payload.id,
        name: payload.name,
        phase: payload.phase,
        expiresAt: payload.expiresAt,
        isModerator: payload.isModerator,
      })
      s.setParticipants(payload.participants ?? [])
      s.setColumns(payload.columns ?? [])
      s.setCards(payload.cards ?? [])
      s.setActionItems(payload.actionItems ?? [])
      if (payload.remainingVotes !== undefined) {
        s.setRemainingVotes(payload.remainingVotes)
      }
      if (payload.timer !== undefined) {
        s.setTimer(payload.timer)
      }
      s.setJoined(true)
    }

    function onParticipantJoined(participant: Participant) {
      const s = getStore()
      s.setParticipants([...s.participants, participant])
    }

    function onParticipantLeft(participant: Participant) {
      const s = getStore()
      s.setParticipants(
        s.participants.filter((p) => p.displayName !== participant.displayName)
      )
    }

    function onCardAdded(card: Card) {
      getStore().addCard(card)
    }

    function onCardUpdated(card: Card) {
      getStore().updateCard(card)
    }

    function onCardDeleted(payload: { cardId: string }) {
      getStore().deleteCard(payload.cardId)
    }

    function onPhaseChanged(payload: PhaseChangedPayload) {
      const existing = getStore().cards
      const merged = payload.cards?.map((c) => {
        const prev = existing.find((e) => e.id === c.id)
        return { ...c, myVotes: prev?.myVotes ?? 0 }
      })
      getStore().setPhase(payload.phase, merged)
    }

    function onVoteUpdated(payload: VoteUpdatedPayload) {
      getStore().updateVoteCount(payload.cardId, payload.voteCount)
    }

    function onMyVotesUpdated(payload: MyVotesUpdatedPayload) {
      getStore().updateMyVotes(payload.cardId, payload.myVotes, payload.remainingVotes)
    }

    function onTimerTick(payload: TimerTickPayload) {
      getStore().setTimer({ active: true, remaining: payload.remaining })
    }

    function onTimerEnded() {
      getStore().setTimer({ active: false, remaining: 0 })
    }

    function onActionAdded(item: ActionItem) {
      getStore().addActionItem(item)
    }

    function onActionUpdated(item: ActionItem) {
      getStore().updateActionItem(item)
    }

    function onColumnAdded(column: BoardColumn) {
      getStore().addColumn(column)
    }

    function onError(payload: { message: string }) {
      console.error('[Socket Error]', payload)
      alert(`Hata: ${payload.message}`)
    }

    socket.on('room_state', onRoomState)
    socket.on('participant_joined', onParticipantJoined)
    socket.on('participant_left', onParticipantLeft)
    socket.on('card_added', onCardAdded)
    socket.on('card_updated', onCardUpdated)
    socket.on('card_deleted', onCardDeleted)
    socket.on('phase_changed', onPhaseChanged)
    socket.on('vote_updated', onVoteUpdated)
    socket.on('my_votes_updated', onMyVotesUpdated)
    socket.on('timer_tick', onTimerTick)
    socket.on('timer_ended', onTimerEnded)
    socket.on('action_added', onActionAdded)
    socket.on('action_updated', onActionUpdated)
    socket.on('column_added', onColumnAdded)
    socket.on('error', onError)

    return () => {
      socket.off('room_state', onRoomState)
      socket.off('participant_joined', onParticipantJoined)
      socket.off('participant_left', onParticipantLeft)
      socket.off('card_added', onCardAdded)
      socket.off('card_updated', onCardUpdated)
      socket.off('card_deleted', onCardDeleted)
      socket.off('phase_changed', onPhaseChanged)
      socket.off('vote_updated', onVoteUpdated)
    socket.off('my_votes_updated', onMyVotesUpdated)
      socket.off('timer_tick', onTimerTick)
      socket.off('timer_ended', onTimerEnded)
      socket.off('action_added', onActionAdded)
      socket.off('action_updated', onActionUpdated)
      socket.off('column_added', onColumnAdded)
      socket.off('error', onError)
    }
  }, [])
}
