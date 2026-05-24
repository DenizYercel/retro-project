import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { Room } from '@prisma/client';

export interface RequestWithRoom extends Request {
  room: Room;
}

export async function validateRoom(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { roomId } = req.params;

  if (!roomId) {
    res.status(400).json({ error: 'roomId is required' });
    return;
  }

  try {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    if (room.expiresAt < new Date()) {
      res.status(410).json({ error: 'Room has expired' });
      return;
    }

    (req as RequestWithRoom).room = room;
    next();
  } catch (error) {
    console.error('[validateRoom] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
