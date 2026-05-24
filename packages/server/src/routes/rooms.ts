import { Router, Request, Response } from 'express';
import prisma from '../prisma/client';
import { validateRoom, RequestWithRoom } from '../middleware/validateRoom';
import { createRoom } from '../services/roomService';
import { getCardsForRoom } from '../services/cardService';
import { getColumnsForRoom } from '../services/columnService';
import { RoomPhase } from '@prisma/client';

const router = Router();

// POST / — create room
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, moderatorToken, moderatorName } = req.body as {
    name?: string;
    moderatorToken?: string;
    moderatorName?: string;
  };

  if (!name || !moderatorToken || !moderatorName) {
    res
      .status(400)
      .json({ error: 'name, moderatorToken, and moderatorName are required' });
    return;
  }

  try {
    const room = await createRoom(name, moderatorToken);

    // Upsert moderator as participant
    await prisma.participant.upsert({
      where: {
        roomId_token: { roomId: room.id, token: moderatorToken },
      },
      create: {
        roomId: room.id,
        token: moderatorToken,
        displayName: moderatorName,
      },
      update: {
        displayName: moderatorName,
      },
    });

    res.status(201).json({
      id: room.id,
      name: room.name,
      phase: room.phase,
      expiresAt: room.expiresAt,
      createdAt: room.createdAt,
    });
  } catch (error) {
    console.error('[POST /rooms] Error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /:roomId — get room state
router.get(
  '/:roomId',
  validateRoom,
  async (req: Request, res: Response): Promise<void> => {
    const room = (req as RequestWithRoom).room;
    const viewerToken = (req.query.token as string) ?? '';

    try {
      const [participants, cards, actionItems, columns] = await Promise.all([
        prisma.participant.findMany({
          where: { roomId: room.id },
          select: { id: true, displayName: true, joinedAt: true, token: true },
        }),
        getCardsForRoom(room.id, room.phase as RoomPhase, viewerToken),
        prisma.actionItem.findMany({
          where: { roomId: room.id },
          orderBy: { createdAt: 'asc' },
        }),
        getColumnsForRoom(room.id),
      ]);

      // Mask participant tokens before sending
      const safeParticipants = participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        joinedAt: p.joinedAt,
        isYou: p.token === viewerToken,
      }));

      res.status(200).json({
        id: room.id,
        name: room.name,
        phase: room.phase,
        expiresAt: room.expiresAt,
        createdAt: room.createdAt,
        isModerator: room.moderatorToken === viewerToken,
        participants: safeParticipants,
        columns,
        cards,
        actionItems,
      });
    } catch (error) {
      console.error('[GET /rooms/:roomId] Error:', error);
      res.status(500).json({ error: 'Failed to fetch room' });
    }
  },
);

// POST /:roomId/join — join room
router.post(
  '/:roomId/join',
  validateRoom,
  async (req: Request, res: Response): Promise<void> => {
    const room = (req as RequestWithRoom).room;
    const { token, displayName } = req.body as {
      token?: string;
      displayName?: string;
    };

    if (!token || !displayName) {
      res.status(400).json({ error: 'token and displayName are required' });
      return;
    }

    try {
      // Check for displayName conflict (different token, same name)
      const nameTaken = await prisma.participant.findFirst({
        where: { roomId: room.id, displayName, NOT: { token } },
      });
      if (nameTaken) {
        res.status(409).json({ error: `"${displayName}" ismi bu odada zaten kullanılıyor. Lütfen farklı bir isim seçin.` });
        return;
      }

      const participant = await prisma.participant.upsert({
        where: {
          roomId_token: { roomId: room.id, token },
        },
        create: {
          roomId: room.id,
          token,
          displayName,
        },
        update: {
          displayName,
        },
      });

      res.status(200).json({
        id: participant.id,
        displayName: participant.displayName,
        joinedAt: participant.joinedAt,
      });
    } catch (error) {
      console.error('[POST /rooms/:roomId/join] Error:', error);
      res.status(500).json({ error: 'Failed to join room' });
    }
  },
);

// POST /:roomId/actions — create action item
router.post(
  '/:roomId/actions',
  validateRoom,
  async (req: Request, res: Response): Promise<void> => {
    const room = (req as RequestWithRoom).room;
    const { content, assignee, token } = req.body as {
      content?: string;
      assignee?: string;
      token?: string;
    };

    if (!content || !token) {
      res.status(400).json({ error: 'content and token are required' });
      return;
    }

    // Verify participant belongs to room
    const participant = await prisma.participant.findUnique({
      where: { roomId_token: { roomId: room.id, token } },
    });

    if (!participant) {
      res.status(403).json({ error: 'Not a participant of this room' });
      return;
    }

    try {
      const actionItem = await prisma.actionItem.create({
        data: {
          roomId: room.id,
          content,
          assignee: assignee ?? null,
        },
      });

      res.status(201).json(actionItem);
    } catch (error) {
      console.error('[POST /rooms/:roomId/actions] Error:', error);
      res.status(500).json({ error: 'Failed to create action item' });
    }
  },
);

// PATCH /:roomId/actions/:actionId — update action item
router.patch(
  '/:roomId/actions/:actionId',
  validateRoom,
  async (req: Request, res: Response): Promise<void> => {
    const room = (req as RequestWithRoom).room;
    const { actionId } = req.params;
    const { completed } = req.body as { completed?: boolean };

    if (typeof completed !== 'boolean') {
      res.status(400).json({ error: 'completed (boolean) is required' });
      return;
    }

    try {
      const actionItem = await prisma.actionItem.findUnique({
        where: { id: actionId },
      });

      if (!actionItem || actionItem.roomId !== room.id) {
        res.status(404).json({ error: 'Action item not found' });
        return;
      }

      const updated = await prisma.actionItem.update({
        where: { id: actionId },
        data: { completed },
      });

      res.status(200).json(updated);
    } catch (error) {
      console.error('[PATCH /rooms/:roomId/actions/:actionId] Error:', error);
      res.status(500).json({ error: 'Failed to update action item' });
    }
  },
);

export default router;
