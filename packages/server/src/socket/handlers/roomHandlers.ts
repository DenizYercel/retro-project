import { Server, Socket } from 'socket.io';
import { RoomPhase } from '@prisma/client';
import prisma from '../../prisma/client';
import { updatePhase } from '../../services/roomService';
import { getCardsForRoom } from '../../services/cardService';
import { getColumnsForRoom } from '../../services/columnService';

type ModeratorAction =
  | 'REVEAL_CARDS'
  | 'START_VOTING'
  | 'END_VOTING'
  | 'CLOSE_ROOM';

export function registerRoomHandlers(io: Server, socket: Socket): void {
  // join_room: client wants to enter a room
  socket.on(
    'join_room',
    async (payload: {
      roomId: string;
      token: string;
      displayName: string;
    }) => {
      try {
        const { roomId, token, displayName } = payload;

        if (!roomId || !token || !displayName) {
          socket.emit('error', { message: 'roomId, token, and displayName are required' });
          return;
        }

        const room = await prisma.room.findUnique({ where: { id: roomId } });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.expiresAt < new Date()) {
          socket.emit('error', { message: 'Room has expired' });
          return;
        }

        // Check for displayName conflict (different token, same name)
        const nameTaken = await prisma.participant.findFirst({
          where: { roomId, displayName, NOT: { token } },
        });
        if (nameTaken) {
          socket.emit('error', { message: `"${displayName}" ismi bu odada zaten kullanılıyor. Lütfen farklı bir isim seçin.` });
          return;
        }

        // Upsert participant
        await prisma.participant.upsert({
          where: { roomId_token: { roomId, token } },
          create: { roomId, token, displayName },
          update: { displayName },
        });

        await socket.join(`room:${roomId}`);

        // Build full room state for this specific token
        const [participants, actionItems, columns] = await Promise.all([
          prisma.participant.findMany({
            where: { roomId },
            select: { id: true, displayName: true, joinedAt: true, token: true },
          }),
          prisma.actionItem.findMany({
            where: { roomId },
            orderBy: { createdAt: 'asc' },
          }),
          getColumnsForRoom(roomId),
        ]);

        const participant = participants.find((p) => p.token === token);
        const cards = await getCardsForRoom(roomId, room.phase as RoomPhase, token, participant?.id);

        const safeParticipants = participants.map((p) => ({
          id: p.id,
          displayName: p.displayName,
          joinedAt: p.joinedAt,
          isYou: p.token === token,
        }));

        // Send full state to the joining socket only
        socket.emit('room_state', {
          id: room.id,
          name: room.name,
          phase: room.phase,
          expiresAt: room.expiresAt,
          isModerator: room.moderatorToken === token,
          participants: safeParticipants,
          columns,
          cards,
          actionItems,
        });

        // Broadcast to everyone else in the room
        const joiningParticipant = participants.find((p) => p.token === token);
        socket.to(`room:${roomId}`).emit('participant_joined', {
          id: joiningParticipant?.id,
          displayName,
        });
      } catch (error) {
        console.error('[join_room] Error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    },
  );

  // moderator_action: phase transitions and room control
  socket.on(
    'moderator_action',
    async (payload: {
      roomId: string;
      token: string;
      action: ModeratorAction;
      data?: Record<string, unknown>;
    }) => {
      try {
        const { roomId, token, action } = payload;

        if (!roomId || !token || !action) {
          socket.emit('error', { message: 'roomId, token, and action are required' });
          return;
        }

        const room = await prisma.room.findUnique({ where: { id: roomId } });

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.moderatorToken !== token) {
          socket.emit('error', { message: 'Unauthorized: you are not the moderator' });
          return;
        }

        switch (action) {
          case 'REVEAL_CARDS': {
            await updatePhase(roomId, RoomPhase.REVEALED);

            // Fetch all cards revealed (no masking)
            const cards = await getCardsForRoom(roomId, RoomPhase.REVEALED, '');

            io.to(`room:${roomId}`).emit('phase_changed', {
              phase: RoomPhase.REVEALED,
              cards,
            });
            break;
          }

          case 'START_VOTING': {
            await updatePhase(roomId, RoomPhase.VOTING);

            const cards = await getCardsForRoom(roomId, RoomPhase.VOTING, '');

            io.to(`room:${roomId}`).emit('phase_changed', {
              phase: RoomPhase.VOTING,
              cards,
              votesPerParticipant: 5,
            });
            break;
          }

          case 'END_VOTING': {
            await updatePhase(roomId, RoomPhase.DONE);

            // Fetch cards sorted by vote count desc
            const rawCards = await prisma.card.findMany({
              where: { roomId },
              include: { _count: { select: { votes: true } } },
              orderBy: { createdAt: 'asc' },
            });

            const sortedCards = rawCards
              .map((card) => ({
                id: card.id,
                roomId: card.roomId,
                columnId: card.columnId,
                content: card.content,
                createdAt: card.createdAt,
                isOwn: false,
                voteCount: card._count.votes,
              }))
              .sort((a, b) => b.voteCount - a.voteCount);

            io.to(`room:${roomId}`).emit('phase_changed', {
              phase: RoomPhase.DONE,
              cards: sortedCards,
            });
            break;
          }

          case 'CLOSE_ROOM': {
            // Force to DONE if not already (skip transition validation via raw update)
            await prisma.room.update({
              where: { id: roomId },
              data: { phase: RoomPhase.DONE },
            });

            io.to(`room:${roomId}`).emit('room_closed', {
              roomId,
              message: 'The moderator has closed the room.',
            });
            break;
          }

          default:
            socket.emit('error', { message: `Unknown action: ${action as string}` });
        }
      } catch (error) {
        console.error('[moderator_action] Error:', error);
        const msg = error instanceof Error ? error.message : 'Moderator action failed';
        socket.emit('error', { message: msg });
      }
    },
  );
}
