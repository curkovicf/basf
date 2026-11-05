-- The status facet and the discontinued count run on every catalogue request. At 50,000
-- products the planner serves them from this index with an index-only scan.
CREATE INDEX "products_status_delisted_at_idx" ON "products"("status", "delisted_at");
