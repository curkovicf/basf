-- launch_year: measured against 50,000 products, 0 scans. Its sorts use NULLS LAST, which
-- a default DESC index cannot serve, and they take about 20 ms without it.
DROP INDEX "products_launch_year_sku_idx";
-- status: dropped in error and restored by the next migration.
DROP INDEX "products_status_delisted_at_idx";
