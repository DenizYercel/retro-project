import { Server, Socket } from 'socket.io';
import prisma from '../../prisma/client';

// Module-level map to track active timers per room
const activeTimers = new Map<string, NodeJS.Timeout>();

export function registerTimerHandlers(io: Server, socket: Socket): void {
  // start_timer: moderator starts a countdown timer for the room
  socket.on(
    'start_timer',
    async (payload: { roomId: string; token: string; duration: number }) => {
      try {
        const { roomId, token, duration } = payload;

        if (!roomId || !token || typeof duration !== 'number' || duration <= 0) {
          socket.emit('error', {
            message: 'roomId, token, and a positive duration (seconds) are required',
          });
          return;
        }

        const room = await prisma.room.findUnique({ where: { id: roomId } });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.moderatorToken !== token) {
          socket.emit('error', { message: 'Unauthorized: only the moderator can start a timer' });
          return;
        }

        // Clear any existing timer for this room
        if (activeTimers.has(roomId)) {
          clearInterval(activeTimers.get(roomId));
          activeTimers.delete(roomId);
        }

        let remaining = duration;

        // Emit the initial tick so the UI shows the full duration immediately
        io.to(`room:${roomId}`).emit('timer_tick', { remaining, total: duration });

        const interval = setInterval(() => {
          remaining -= 1;

          if (remaining <= 0) {
            clearInterval(interval);
            activeTimers.delete(roomId);
            io.to(`room:${roomId}`).emit('timer_ended', { roomId });
          } else {
            io.to(`room:${roomId}`).emit('timer_tick', { remaining, total: duration });
          }
        }, 1000);

        activeTimers.set(roomId, interval);
      } catch (error) {
        console.error('[start_timer] Error:', error);
        socket.emit('error', { message: 'Failed to start timer' });
      }
    },
  );

  // stop_timer: moderator cancels the running timer
  socket.on(
    'stop_timer',
    async (payload: { roomId: string; token: string }) => {
      try {
        const { roomId, token } = payload;

        if (!roomId || !token) {
          socket.emit('error', { message: 'roomId and token are required' });
          return;
        }

        const room = await prisma.room.findUnique({ where: { id: roomId } });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.moderatorToken !== token) {
          socket.emit('error', { message: 'Unauthorized: only the moderator can stop a timer' });
          return;
        }

        if (activeTimers.has(roomId)) {
          clearInterval(activeTimers.get(roomId));
          activeTimers.delete(roomId);
          io.to(`room:${roomId}`).emit('timer_stopped', { roomId });
        } else {
          socket.emit('error', { message: 'No active timer found for this room' });
        }
      } catch (error) {
        console.error('[stop_timer] Error:', error);
        socket.emit('error', { message: 'Failed to stop timer' });
      }
    },
  );
}

// Exported so cleanup jobs or graceful shutdown can clear all timers
export function clearAllTimers(): void {
  for (const [roomId, interval] of activeTimers.entries()) {
    clearInterval(interval);
    activeTimers.delete(roomId);
    console.log(`[timer] Cleared timer for room ${roomId}`);
  }
}
