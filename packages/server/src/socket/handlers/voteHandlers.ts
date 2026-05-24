import { Server, Socket } from 'socket.io';
import prisma from '../../prisma/client';
import { castVote, retractVote, getVotesForParticipant } from '../../services/voteService';
import { getVoteCount } from '../../services/cardService';

export function registerVoteHandlers(io: Server, socket: Socket): void {
  // cast_vote: participant votes on a card
  socket.on(
    'cast_vote',
    async (payload: { cardId: string; token: string; roomId: string }) => {
      try {
        const { cardId, token, roomId } = payload;

        if (!cardId || !token || !roomId) {
          socket.emit('error', { message: 'cardId, token, and roomId are required' });
          return;
        }

        const participant = await prisma.participant.findUnique({
          where: { roomId_token: { roomId, token } },
        });

        if (!participant) {
          socket.emit('error', { message: 'Participant not found in this room' });
          return;
        }

        await castVote(cardId, participant.id, roomId);

        const [voteCount, myVotesMap] = await Promise.all([
          getVoteCount(cardId),
          getVotesForParticipant(roomId, participant.id),
        ]);

        const myVotes = myVotesMap[cardId] ?? 0;
        const totalMyVotes = Object.values(myVotesMap).reduce((sum, v) => sum + v, 0);

        io.to(`room:${roomId}`).emit('vote_updated', {
          cardId,
          voteCount,
        });

        // Send personal vote state only to the voter
        socket.emit('my_votes_updated', {
          cardId,
          myVotes,
          totalMyVotes,
          remainingVotes: 5 - totalMyVotes,
        });
      } catch (error) {
        console.error('[cast_vote] Error:', error);
        const msg = error instanceof Error ? error.message : 'Failed to cast vote';
        socket.emit('error', { message: msg });
      }
    },
  );

  // retract_vote: participant removes one of their votes from a card
  socket.on(
    'retract_vote',
    async (payload: { cardId: string; token: string; roomId: string }) => {
      try {
        const { cardId, token, roomId } = payload;

        if (!cardId || !token || !roomId) {
          socket.emit('error', { message: 'cardId, token, and roomId are required' });
          return;
        }

        const participant = await prisma.participant.findUnique({
          where: { roomId_token: { roomId, token } },
        });

        if (!participant) {
          socket.emit('error', { message: 'Participant not found in this room' });
          return;
        }

        await retractVote(cardId, participant.id);

        const [voteCount, myVotesMap] = await Promise.all([
          getVoteCount(cardId),
          getVotesForParticipant(roomId, participant.id),
        ]);

        const myVotes = myVotesMap[cardId] ?? 0;
        const totalMyVotes = Object.values(myVotesMap).reduce((sum, v) => sum + v, 0);

        io.to(`room:${roomId}`).emit('vote_updated', {
          cardId,
          voteCount,
        });

        socket.emit('my_votes_updated', {
          cardId,
          myVotes,
          totalMyVotes,
          remainingVotes: 5 - totalMyVotes,
        });
      } catch (error) {
        console.error('[retract_vote] Error:', error);
        const msg = error instanceof Error ? error.message : 'Failed to retract vote';
        socket.emit('error', { message: msg });
      }
    },
  );
}
