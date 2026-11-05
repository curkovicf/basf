import { ProductStatus } from '@pf/shared-types';

export const STATUS_LABELS: Record<ProductStatus, string> = {
  ACTIVE: 'Active',
  PHASE_OUT: 'Phase-out',
  DISCONTINUED: 'Discontinued',
};

export type TagSeverity = 'success' | 'warn' | 'danger';

export const STATUS_SEVERITY: Record<ProductStatus, TagSeverity> = {
  ACTIVE: 'success',
  PHASE_OUT: 'warn',
  DISCONTINUED: 'danger',
};

export function statusLabel(value: string): string {
  return STATUS_LABELS[value as ProductStatus] ?? value;
}
