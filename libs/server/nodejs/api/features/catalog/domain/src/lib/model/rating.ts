import type { RatingSummaryDto } from '@pf/shared-types';

/** Rounds to one decimal, and reports null rather than 0 while nobody has rated the product. */
export function ratingSummary(count: number, average: number): RatingSummaryDto {
  return { count, average: count > 0 ? Math.round(average * 10) / 10 : null };
}
