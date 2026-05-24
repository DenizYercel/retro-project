import { useRoomStore } from '../store/roomStore'
import socket from '../lib/socket'

export function useRoom() {
  const store = useRoomStore()

  function joinRoom(roomId: string, token: string, displayName: string) {
    if (!socket.connected) {
      socket.connect()
    }
    socket.emit('join_room', { roomId, token, displayName })
  }

  function addCard(roomId: string, columnId: string, content: string, token: string) {
    socket.emit('add_card', { roomId, columnId, content, token })
  }

  function addColumn(roomId: string, token: string, name: string) {
    socket.emit('add_column', { roomId, token, name })
  }

  function editCard(cardId: string, content: string, token: string) {
    socket.emit('edit_card', { cardId, content, token })
  }

  function deleteCard(cardId: string, token: string) {
    socket.emit('delete_card', { cardId, token })
  }

  function castVote(cardId: string, token: string, roomId: string) {
    socket.emit('cast_vote', { cardId, token, roomId })
  }

  function retractVote(cardId: string, token: string, roomId: string) {
    socket.emit('retract_vote', { cardId, token, roomId })
  }

  function moderatorAction(
    roomId: string,
    token: string,
    action: string,
    data?: Record<string, unknown>
  ) {
    socket.emit('moderator_action', { roomId, token, action, ...data })
  }

  function startTimer(roomId: string, token: string, duration: number) {
    socket.emit('start_timer', { roomId, token, duration })
  }

  return {
    // State
    room: store.room,
    participants: store.participants,
    columns: store.columns,
    cards: store.cards,
    actionItems: store.actionItems,
    myToken: store.myToken,
    myDisplayName: store.myDisplayName,
    remainingVotes: store.remainingVotes,
    timer: store.timer,
    isJoined: store.isJoined,

    // Actions
    joinRoom,
    addCard,
    addColumn,
    editCard,
    deleteCard,
    castVote,
    retractVote,
    moderatorAction,
    startTimer,
  }
}
