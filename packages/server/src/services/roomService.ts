import { RoomPhase } from '@prisma/client';
import prisma from '../prisma/client';
import { createDefaultColumns } from './columnService';

const VALID_TRANSITIONS: Record<RoomPhase, RoomPhase | null> = {
  WRITING: RoomPhase.REVEALED,
  REVEALED: RoomPhase.VOTING,
  VOTING: RoomPhase.DONE,
  DONE: null,
};

export async function createRoom(
  name: string,
  moderatorToken: string,
): Promise<{
  id: string;
  name: string;
  phase: RoomPhase;
  moderatorToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const room = await prisma.room.create({
    data: { name, moderatorToken, expiresAt },
  });

  await createDefaultColumns(room.id);

  return room;
}

export async function getRoom(roomId: string) {
  return prisma.room.findUnique({
    where: { id: roomId },
    include: {
      participants: true,
      cards: true,
      actionItems: true,
    },
  });
}

export async function updatePhase(
  roomId: string,
  newPhase: RoomPhase,
): Promise<{
  id: string;
  name: string;
  phase: RoomPhase;
  moderatorToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}> {
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    throw new Error('Room not found');
  }

  const allowedNext = VALID_TRANSITIONS[room.phase];

  if (allowedNext !== newPhase) {
    throw new Error(
      `Invalid phase transition: ${room.phase} → ${newPhase}. Allowed next phase: ${allowedNext ?? 'none (room is DONE)'}`,
    );
  }

  const updated = await prisma.room.update({
    where: { id: roomId },
    data: { phase: newPhase },
  });

  return updated;
}
