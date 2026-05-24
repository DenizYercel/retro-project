import prisma from '../prisma/client';

export interface ColumnData {
  id: string;
  roomId: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
}

const DAKI_DEFAULTS = [
  { name: 'Keep',    color: '#0f766e', order: 0 },
  { name: 'Drop',    color: '#be123c', order: 1 },
  { name: 'Add',     color: '#1d4ed8', order: 2 },
  { name: 'Improve', color: '#b45309', order: 3 },
];

export async function createDefaultColumns(roomId: string): Promise<void> {
  await prisma.column.createMany({
    data: DAKI_DEFAULTS.map((d) => ({ ...d, roomId, isDefault: true })),
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
