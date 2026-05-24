-- CreateTable: Column
CREATE TABLE "Column" (
    "id"        TEXT NOT NULL,
    "roomId"    TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "color"     TEXT NOT NULL DEFAULT '#6366f1',
    "order"     INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Column_roomId_idx" ON "Column"("roomId");
ALTER TABLE "Column" ADD CONSTRAINT "Column_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add columnId to Card (nullable first)
ALTER TABLE "Card" ADD COLUMN "columnId" TEXT;

-- For each existing room: create 4 default DAKI columns and migrate cards
DO $$
DECLARE
    r          RECORD;
    keep_id    TEXT;
    drop_id    TEXT;
    add_id     TEXT;
    improve_id TEXT;
BEGIN
    FOR r IN SELECT id FROM "Room" LOOP
        keep_id    := gen_random_uuid()::text;
        drop_id    := gen_random_uuid()::text;
        add_id     := gen_random_uuid()::text;
        improve_id := gen_random_uuid()::text;

        INSERT INTO "Column" ("id", "roomId", "name", "color", "order", "isDefault") VALUES
            (keep_id,    r.id, 'Keep',    '#10b981', 0, true),
            (drop_id,    r.id, 'Drop',    '#ef4444', 1, true),
            (add_id,     r.id, 'Add',     '#3b82f6', 2, true),
            (improve_id, r.id, 'Improve', '#f59e0b', 3, true);

        UPDATE "Card" SET "columnId" = keep_id    WHERE "roomId" = r.id AND "column"::text = 'KEEP';
        UPDATE "Card" SET "columnId" = drop_id    WHERE "roomId" = r.id AND "column"::text = 'DROP';
        UPDATE "Card" SET "columnId" = add_id     WHERE "roomId" = r.id AND "column"::text = 'ADD';
        UPDATE "Card" SET "columnId" = improve_id WHERE "roomId" = r.id AND "column"::text = 'IMPROVE';
    END LOOP;
END $$;

-- Add FK, index, then NOT NULL
ALTER TABLE "Card" ADD CONSTRAINT "Card_columnId_fkey"
    FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Card_columnId_idx" ON "Card"("columnId");
ALTER TABLE "Card" ALTER COLUMN "columnId" SET NOT NULL;

-- Drop old enum column and type
ALTER TABLE "Card" DROP COLUMN "column";
DROP TYPE IF EXISTS "CardColumn";
