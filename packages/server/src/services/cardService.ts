import { RoomPhase } from '@prisma/client';
import prisma from '../prisma/client';
import { getVotesForParticipant } from './voteService';

export interface SafeCard {
  id: string;
  roomId: string;
  columnId: string;
  content: string;
  createdAt: Date;
  isOwn: boolean;
  voteCount: number;
  myVotes: number;
}

export async function addCard(
  roomId: string,
  columnId: string,
  content: string,
  authorToken: string,
): Promise<SafeCard> {
  const card = await prisma.card.create({
    data: { roomId, columnId, content, authorToken },
  });
  return { id: card.id, roomId: card.roomId, columnId: card.columnId, content: card.content, createdAt: card.createdAt, isOwn: true, voteCount: 0, myVotes: 0 };
}

export async function editCard(cardId: string, content: string, authorToken: string): Promise<SafeCard> {
  const existing = await prisma.card.findUnique({ where: { id: cardId } });
  if (!existing) throw new Error('Card not found');
  if (existing.authorToken !== authorToken) throw new Error('Unauthorized: you do not own this card');
  const updated = await prisma.card.update({ where: { id: cardId }, data: { content } });
  const voteCount = await getVoteCount(cardId);
  return { id: updated.id, roomId: updated.roomId, columnId: updated.columnId, content: updated.content, createdAt: updated.createdAt, isOwn: true, voteCount, myVotes: 0 };
}

export async function deleteCard(cardId: string, authorToken: string): Promise<void> {
  const existing = await prisma.card.findUnique({ where: { id: cardId } });
  if (!existing) throw new Error('Card not found');
  if (existing.authorToken !== authorToken) throw new Error('Unauthorized: you do not own this card');
  await prisma.card.delete({ where: { id: cardId } });
}

export async function getCardsForRoom(
  roomId: string,
  phase: RoomPhase,
  viewerToken: string,
  participantId?: string,
): Promise<SafeCard[]> {
  const [cards, myVotesMap] = await Promise.all([
    prisma.card.findMany({
      where: { roomId },
      include: { _count: { select: { votes: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    participantId ? getVotesForParticipant(roomId, participantId) : Promise.resolve({} as Record<string, number>),
  ]);

  return cards.map((card) => {
    const isOwn = card.authorToken === viewerToken;
    const voteCount = card._count.votes;
    const myVotes = myVotesMap[card.id] ?? 0;
    const content = phase === RoomPhase.WRITING && !isOwn ? '***' : card.content;
    return { id: card.id, roomId: card.roomId, columnId: card.columnId, content, createdAt: card.createdAt, isOwn, voteCount, myVotes };
  });
}

export async function getVoteCount(cardId: string): Promise<number> {
  return prisma.vote.count({ where: { cardId } });
}
