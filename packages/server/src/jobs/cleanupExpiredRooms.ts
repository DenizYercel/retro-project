import cron from 'node-cron';
import prisma from '../prisma/client';

export function startCleanupJob(): void {
  // Runs every day at 03:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[cleanup] Running expired rooms cleanup job...');

    try {
      const result = await prisma.room.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      console.log(`[cleanup] Deleted ${result.count} expired room(s).`);
    } catch (error) {
      console.error('[cleanup] Failed to delete expired rooms:', error);
    }
  });

  console.log('[cleanup] Cleanup cron job scheduled for 03:00 AM daily.');
}
