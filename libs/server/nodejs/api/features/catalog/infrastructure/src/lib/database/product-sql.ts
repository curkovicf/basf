import { Prisma } from '@pf/server-nodejs-api-shared-infrastructure';
import {
  FilterGroup,
  ProductSearchCriteria,
  effectiveStatuses,
  expandRegions,
  resolveSort,
} from '@pf/server-nodejs-api-features-catalog-domain';
import type { ProductStatus } from '@pf/shared-types';

const MAX_SEARCH_TOKENS = 8;

export const PRODUCT_COLUMNS = Prisma.sql`
  sku, name, chemical_name, function, application_area, region, certifications,
  status::text AS status, launch_year, description, delisted_at, rating_count, rating_avg`;

/** Tokens of a search string, with LIKE wildcards in user input made literal. */
export function searchPatterns(q: string | undefined): string[] {
  if (!q) return [];
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_SEARCH_TOKENS)
    .map((token) => `%${token.replace(/[\\%_]/g, '\\$&')}%`);
}

/** A product that left the export is no longer for sale, whatever its last status said. */
export const EFFECTIVE_STATUS_SQL = Prisma.sql`
  CASE WHEN delisted_at IS NOT NULL THEN 'DISCONTINUED' ELSE status::text END`;

function statusCondition(statuses: ProductStatus[]): Prisma.Sql {
  const wantsDiscontinued = statuses.includes('DISCONTINUED');
  const live = statuses.filter((status) => status !== 'DISCONTINUED');
  const conditions: Prisma.Sql[] = [];
  if (live.length > 0) {
    conditions.push(Prisma.sql`(delisted_at IS NULL AND status::text = ANY(${live}::text[]))`);
  }
  if (wantsDiscontinued) {
    conditions.push(Prisma.sql`(delisted_at IS NOT NULL OR status = 'DISCONTINUED')`);
  }
  return Prisma.sql`(${Prisma.join(conditions, ' OR ')})`;
}

/**
 * Filters combine with AND across groups and OR within a group, except certifications,
 * which are AND ("vegan and halal"). `omit` drops one group, so that its facet shows
 * what the user could switch to rather than only what is already selected.
 */
export function buildWhere(criteria: ProductSearchCriteria, omit?: FilterGroup): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];

  for (const pattern of searchPatterns(criteria.q)) {
    conditions.push(Prisma.sql`search_text LIKE ${pattern}`);
  }
  if (criteria.function?.length && omit !== 'function') {
    conditions.push(Prisma.sql`function = ANY(${criteria.function}::text[])`);
  }
  if (criteria.applicationArea?.length && omit !== 'applicationArea') {
    conditions.push(Prisma.sql`application_area = ANY(${criteria.applicationArea}::text[])`);
  }
  if (criteria.region?.length && omit !== 'region') {
    conditions.push(Prisma.sql`region = ANY(${expandRegions(criteria.region)}::text[])`);
  }
  if (criteria.certification?.length) {
    conditions.push(Prisma.sql`certifications @> ${criteria.certification}::text[]`);
  }
  if (omit !== 'status') {
    conditions.push(statusCondition(effectiveStatuses(criteria)));
  }

  return conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;
}

/** Every ordering ends in the unique SKU; without that, pages could repeat or skip rows. */
export function buildOrderBy(criteria: ProductSearchCriteria): Prisma.Sql {
  switch (resolveSort(criteria)) {
    case 'relevance': {
      const q = (criteria.q ?? '').toLowerCase();
      const escaped = q.replace(/[\\%_]/g, '\\$&');
      return Prisma.sql`ORDER BY
        CASE
          WHEN lower(sku) = ${q} THEN 0
          WHEN lower(name) = ${q} THEN 1
          WHEN lower(name) LIKE ${`${escaped}%`} THEN 2
          WHEN lower(name) LIKE ${`%${escaped}%`} THEN 3
          WHEN lower(chemical_name) LIKE ${`%${escaped}%`} THEN 4
          ELSE 5
        END, name, sku`;
    }
    case 'newest':
      return Prisma.sql`ORDER BY launch_year DESC NULLS LAST, sku`;
    case 'oldest':
      return Prisma.sql`ORDER BY launch_year ASC NULLS LAST, sku`;
    case 'rating':
      return Prisma.sql`ORDER BY rating_avg DESC, rating_count DESC, sku`;
    case 'name':
      return Prisma.sql`ORDER BY name, sku`;
  }
}
