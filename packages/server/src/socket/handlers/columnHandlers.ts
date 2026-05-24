import { Server, Socket } from 'socket.io';
import prisma from '../../prisma/client';
import { addCustomColumn } from '../../services/columnService';

export function registerColumnHandlers(io: Server, socket: Socket): void {
  socket.on(
    'add_column',
    async (payload: { roomId: string; token: string; name: string }) => {
      try {
        const { roomId, token, name } = payload;

        if (!roomId || !token || !name?.trim()) {
          socket.emit('error', { message: 'roomId, token, and name are required' });
          return;
        }

        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) { socket.emit('error', { message: 'Room not found' }); return; }
        if (room.moderatorToken !== token) {
          socket.emit('error', { message: 'Sadece moderatör sütun ekleyebilir' }); return;
        }

        const column = await addCustomColumn(roomId, name.trim());
        io.to(`room:${roomId}`).emit('column_added', column);
      } catch (error) {
        console.error('[add_column] Error:', error);
        socket.emit('error', { message: 'Failed to add column' });
      }
    },
  );
}
