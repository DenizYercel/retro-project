import prisma from '../prisma/client';

export interface ColumnData {
  id: string;
  roomId: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
}

type ColumnDef = { name: string; color: string; order: number };

export const TEMPLATES: Record<string, ColumnDef[]> = {
  daki: [
    { name: 'Keep',    color: '#0f766e', order: 0 },
    { name: 'Drop',    color: '#be123c', order: 1 },
    { name: 'Add',     color: '#1d4ed8', order: 2 },
    { name: 'Improve', color: '#b45309', order: 3 },
  ],
  start_stop_continue: [
    { name: 'Start',    color: '#1d4ed8', order: 0 },
    { name: 'Stop',     color: '#be123c', order: 1 },
    { name: 'Continue', color: '#0f766e', order: 2 },
  ],
  mad_sad_glad: [
    { name: 'Mad',  color: '#be123c', order: 0 },
    { name: 'Sad',  color: '#b45309', order: 1 },
    { name: 'Glad', color: '#0f766e', order: 2 },
  ],
  four_ls: [
    { name: 'Liked',      color: '#0f766e', order: 0 },
    { name: 'Learned',    color: '#1d4ed8', order: 1 },
    { name: 'Lacked',     color: '#be123c', order: 2 },
    { name: 'Longed For', color: '#b45309', order: 3 },
  ],
  www_ebi: [
    { name: 'What Went Well', color: '#0f766e', order: 0 },
    { name: 'Even Better If', color: '#1d4ed8', order: 1 },
  ],
};

export async function createDefaultColumns(roomId: string, template = 'daki'): Promise<void> {
  const columns = TEMPLATES[template] ?? TEMPLATES.daki;
  await prisma.column.createMany({
    data: columns.map((d) => ({ ...d, roomId, isDefault: true })),
  });
}

export async function getColumnsForRoom(roomId: string): Promise<ColumnData[]> {
  return prisma.column.findMany({
    where: { roomId },
    orderBy: { order: 'asc' },
  });
}

export async function addCustomColumn(roomId: string, name: string): Promise<ColumnData> {
  const columns = await prisma.column.findMany({ where: { roomId } });
  const maxOrder = columns.reduce((m, c) => Math.max(m, c.order), -1);
  return prisma.column.create({
    data: { roomId, name: name.trim(), color: '#475569', order: maxOrder + 1, isDefault: false },
  });
}
