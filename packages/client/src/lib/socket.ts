import { io, Socket } from 'socket.io-client'

const wsUrl = import.meta.env.VITE_WS_URL ?? ''

const socket: Socket = io(wsUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
})

export default socket
