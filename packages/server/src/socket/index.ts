import { Server, Socket } from 'socket.io';
import prisma from '../prisma/client';
import { registerRoomHandlers } from './handlers/roomHandlers';
import { registerCardHandlers } from './handlers/cardHandlers';
import { registerVoteHandlers } from './handlers/voteHandlers';
import { registerTimerHandlers } from './handlers/timerHandlers';
import { registerColumnHandlers } from './handlers/columnHandlers';

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    // Register all domain-specific event handlers
    registerRoomHandlers(io, socket);
    registerCardHandlers(io, socket);
    registerVoteHandlers(io, socket);
    registerTimerHandlers(io, socket);
    registerColumnHandlers(io, socket);

    socket.on('disconnect', async () => {
      console.log(`[socket] Client disconnected: ${socket.id}`);

      try {
        // Determine which rooms this socket was in
        // socket.rooms contains the socket's own ID + any joined rooms
        const joinedRooms = Array.from(socket.rooms).filter(
          (room) => room !== socket.id && room.startsWith('room:'),
        );

        for (const roomKey of joinedRooms) {
          const roomId = roomKey.replace('room:', '');

          // We don't have the token here, so we can't delete by token.
          // Instead broadcast a generic participant_left with the socket id.
          // The client can reconcile based on its own state.
          socket.to(roomKey).emit('participant_left', {
            socketId: socket.id,
            roomId,
          });
        }
      } catch (error) {
        console.error('[disconnect] Error broadcasting participant_left:', error);
      }
    });
  });
}

// Re-export prisma so consumers don't need a separate import
export { prisma };
