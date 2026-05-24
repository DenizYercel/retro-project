-- Migrate CardColumn enum from 3-column to DAKI (Drop, Add, Keep, Improve)

-- Step 1: Create new enum type
CREATE TYPE "CardColumn_new" AS ENUM ('KEEP', 'DROP', 'ADD', 'IMPROVE');

-- Step 2: Migrate existing data
ALTER TABLE "Card"
  ALTER COLUMN "column" TYPE "CardColumn_new"
  USING (
    CASE "column"::text
      WHEN 'WENT_WELL'   THEN 'KEEP'
      WHEN 'TO_IMPROVE'  THEN 'IMPROVE'
      WHEN 'ACTION_IDEA' THEN 'ADD'
      ELSE 'KEEP'
    END
  )::"CardColumn_new";

-- Step 3: Swap types
DROP TYPE "CardColumn";
ALTER TYPE "CardColumn_new" RENAME TO "CardColumn";
