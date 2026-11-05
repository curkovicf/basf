-- Trigram search (see products_search_text_trgm_idx). Must exist before the index below.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'PHASE_OUT', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chemical_name" TEXT NOT NULL,
    "function" TEXT NOT NULL,
    "application_area" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "certifications" TEXT[],
    "status" "ProductStatus" NOT NULL,
    "launch_year" INTEGER,
    "description" TEXT NOT NULL,
    "search_text" TEXT NOT NULL,
    "delisted_at" TIMESTAMP(3),
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "rating_sum" INTEGER NOT NULL DEFAULT 0,
    "rating_avg" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "author_name" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_runs" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" JSONB NOT NULL,
    "issues" JSONB NOT NULL,

    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_search_text_trgm_idx" ON "products" USING GIN ("search_text" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_certifications_idx" ON "products" USING GIN ("certifications");

-- CreateIndex
CREATE INDEX "products_status_delisted_at_idx" ON "products"("status", "delisted_at");

-- CreateIndex
CREATE INDEX "products_name_sku_idx" ON "products"("name", "sku");

-- CreateIndex
CREATE INDEX "products_launch_year_sku_idx" ON "products"("launch_year" DESC, "sku");

-- CreateIndex
CREATE INDEX "products_rating_avg_rating_count_sku_idx" ON "products"("rating_avg" DESC, "rating_count" DESC, "sku");

-- CreateIndex
CREATE INDEX "reviews_product_id_created_at_idx" ON "reviews"("product_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "import_runs_status_finished_at_idx" ON "import_runs"("status", "finished_at" DESC);

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Not expressible in the Prisma schema: last line of defence for rating integrity.
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
