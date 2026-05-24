import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import healthRouter from './routes/health';
import roomsRouter from './routes/rooms';
import { setupSocketHandlers } from './socket';
import { startCleanupJob } from './jobs/cleanupExpiredRooms';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/v1/rooms', roomsRouter);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── HTTP + Socket.io server ─────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true,
  },
});

setupSocketHandlers(io);

// ── Cron jobs ───────────────────────────────────────────────────────────────
startCleanupJob();

// ── Start ───────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT}`);
  console.log(`[server] Accepting connections from: ${CLIENT_ORIGIN}`);
});

// ── Graceful shutdown ───────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[server] SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
});
