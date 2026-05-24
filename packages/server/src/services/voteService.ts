import prisma from '../prisma/client';

const MAX_VOTES_PER_ROOM = 5;
const MAX_VOTES_PER_CARD = 3;

export async function castVote(
  cardId: string,
  participantId: string,
  roomId: string,
): Promise<void> {
  const card = await prisma.card.findUnique({ where: { id: cardId } });

  if (!card) {
    throw new Error('Card not found');
  }

  if (card.roomId !== roomId) {
    throw new Error('Card does not belong to this room');
  }

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });

  if (!participant) {
    throw new Error('Participant not found');
  }

  if (card.authorToken === participant.token) {
    throw new Error('You cannot vote for your own card');
  }

  const totalVotesInRoom = await prisma.vote.count({
    where: {
      participantId,
      card: { roomId },
    },
  });

  if (totalVotesInRoom >= MAX_VOTES_PER_ROOM) {
    throw new Error(
      `Vote limit reached: maximum ${MAX_VOTES_PER_ROOM} votes per participant per room`,
    );
  }

  const votesOnThisCard = await prisma.vote.count({
    where: { cardId, participantId },
  });

  if (votesOnThisCard >= MAX_VOTES_PER_CARD) {
    throw new Error(
      `Vote limit reached: maximum ${MAX_VOTES_PER_CARD} votes per card`,
    );
  }

  await prisma.vote.create({
    data: { cardId, participantId },
  });
}

export async function retractVote(
  cardId: string,
  participantId: string,
): Promise<void> {
  const mostRecent = await prisma.vote.findFirst({
    where: { cardId, participantId },
    orderBy: { createdAt: 'desc' },
  });

  if (!mostRecent) {
    throw new Error('No vote found to retract');
  }

  await prisma.vote.delete({ where: { id: mostRecent.id } });
}

export async function getVotesForParticipant(
  roomId: string,
  participantId: string,
): Promise<Record<string, number>> {
  const votes = await prisma.vote.findMany({
    where: {
      participantId,
      card: { roomId },
    },
    select: { cardId: true },
  });

  const voteMap: Record<string, number> = {};

  for (const vote of votes) {
    voteMap[vote.cardId] = (voteMap[vote.cardId] ?? 0) + 1;
  }

  return voteMap;
}
