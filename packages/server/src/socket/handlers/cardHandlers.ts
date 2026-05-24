import { Server, Socket } from 'socket.io';
import { RoomPhase } from '@prisma/client';
import prisma from '../../prisma/client';
import { addCard, editCard, deleteCard } from '../../services/cardService';

export function registerCardHandlers(io: Server, socket: Socket): void {
  socket.on(
    'add_card',
    async (payload: { roomId: string; columnId: string; content: string; token: string }) => {
      try {
        const { roomId, columnId, content, token } = payload;

        if (!roomId || !columnId || !content || !token) {
          socket.emit('error', { message: 'roomId, columnId, content, and token are required' });
          return;
        }

        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) { socket.emit('error', { message: 'Room not found' }); return; }
        if (room.phase !== RoomPhase.WRITING) {
          socket.emit('error', { message: 'Cards can only be added during the WRITING phase' });
          return;
        }

        const column = await prisma.column.findUnique({ where: { id: columnId } });
        if (!column || column.roomId !== roomId) {
          socket.emit('error', { message: 'Column not found' }); return;
        }

        const newCard = await addCard(roomId, columnId, content, token);
        const maskedCard = { ...newCard, content: '***', isOwn: false };

        socket.to(`room:${roomId}`).emit('card_added', maskedCard);
        socket.emit('card_added', newCard);
      } catch (error) {
        console.error('[add_card] Error:', error);
        socket.emit('error', { message: 'Failed to add card' });
      }
    },
  );

  socket.on(
    'edit_card',
    async (payload: { cardId: string; content: string; token: string }) => {
      try {
        const { cardId, content, token } = payload;
        if (!cardId || !content || !token) {
          socket.emit('error', { message: 'cardId, content, and token are required' }); return;
        }

        const card = await prisma.card.findUnique({ where: { id: cardId } });
        if (!card) { socket.emit('error', { message: 'Card not found' }); return; }

        const room = await prisma.room.findUnique({ where: { id: card.roomId } });
        const updatedCard = await editCard(cardId, content, token);

        if (room?.phase === RoomPhase.WRITING) {
          socket.to(`room:${card.roomId}`).emit('card_updated', { ...updatedCard, content: '***', isOwn: false });
          socket.emit('card_updated', updatedCard);
        } else {
          io.to(`room:${card.roomId}`).emit('card_updated', updatedCard);
        }
      } catch (error) {
        console.error('[edit_card] Error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to edit card' });
      }
    },
  );

  socket.on(
    'delete_card',
    async (payload: { cardId: string; token: string }) => {
      try {
        const { cardId, token } = payload;
        if (!cardId || !token) { socket.emit('error', { message: 'cardId and token are required' }); return; }

        const card = await prisma.card.findUnique({ where: { id: cardId } });
        if (!card) { socket.emit('error', { message: 'Card not found' }); return; }

        const roomId = card.roomId;
        await deleteCard(cardId, token);
        io.to(`room:${roomId}`).emit('card_deleted', { cardId });
      } catch (error) {
        console.error('[delete_card] Error:', error);
        socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to delete card' });
      }
    },
  );
}
