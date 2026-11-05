-- Unrated products sort last via a plain DESC index, without NULLS LAST.
UPDATE "products" SET "rating_avg" = 0 WHERE "rating_avg" IS NULL;
ALTER TABLE "products" ALTER COLUMN "rating_avg" SET DEFAULT 0;
ALTER TABLE "products" ALTER COLUMN "rating_avg" SET NOT NULL;
