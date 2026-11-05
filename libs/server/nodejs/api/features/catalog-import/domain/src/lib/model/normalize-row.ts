export type ProductStatusValue = 'ACTIVE' | 'PHASE_OUT' | 'DISCONTINUED';

export interface NormalizedProduct {
  sku: string;
  name: string;
  chemicalName: string;
  function: string;
  applicationArea: string;
  region: string;
  certifications: string[];
  status: ProductStatusValue;
  launchYear: number | null;
  description: string;
  searchText: string;
}

export type RawRow = Record<string, string | undefined>;

export type NormalizeResult =
  | { ok: true; product: NormalizedProduct; warnings: string[] }
  | { ok: false; sku: string | null; reason: string };

export const REQUIRED_COLUMNS = [
  'sku',
  'name',
  'chemical_name',
  'function',
  'application_area',
  'region',
  'certifications',
  'status',
  'launch_year',
  'description',
] as const;

const REQUIRED_VALUES = [
  'name',
  'chemical_name',
  'function',
  'application_area',
  'region',
  'description',
] as const;

const EARLIEST_PLAUSIBLE_YEAR = 1900;

const clean = (value: string | undefined): string => (value ?? '').replace(/\s+/g, ' ').trim();

/**
 * Status drives what customers are told is for sale, so it is the one field we
 * refuse to guess: spelling variants are mapped, anything else rejects the row.
 */
export function parseStatus(raw: string): ProductStatusValue | null {
  switch (
    clean(raw)
      .toLowerCase()
      .replace(/[\s_-]+/g, '')
  ) {
    case 'active':
      return 'ACTIVE';
    case 'phaseout':
      return 'PHASE_OUT';
    case 'discontinued':
      return 'DISCONTINUED';
    default:
      return null;
  }
}

/** A missing year must not cost us the product, so bad values become null. */
export function parseLaunchYear(raw: string, now: Date = new Date()): number | null {
  const value = clean(raw);
  if (!/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return year >= EARLIEST_PLAUSIBLE_YEAR && year <= now.getFullYear() + 1 ? year : null;
}

export function parseCertifications(raw: string): string[] {
  const values = raw.split('|').map(clean).filter(Boolean);
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/** Validates and canonicalises one CSV row. Pure: no I/O, no knowledge of the database. */
export function normalizeRow(row: RawRow): NormalizeResult {
  const sku = clean(row['sku']).toUpperCase();
  if (!sku) return { ok: false, sku: null, reason: 'missing sku' };

  const missing = REQUIRED_VALUES.filter((column) => !clean(row[column]));
  if (missing.length > 0) {
    return { ok: false, sku, reason: `missing ${missing.join(', ')}` };
  }

  const status = parseStatus(row['status'] ?? '');
  if (!status) {
    return { ok: false, sku, reason: `unknown status "${clean(row['status'])}"` };
  }

  const warnings: string[] = [];
  const rawYear = clean(row['launch_year']);
  const launchYear = parseLaunchYear(rawYear);
  if (rawYear === '' || launchYear === null) {
    warnings.push(`launch_year "${rawYear}" treated as unknown`);
  }

  const product = {
    sku,
    name: clean(row['name']),
    chemicalName: clean(row['chemical_name']),
    function: clean(row['function']),
    applicationArea: clean(row['application_area']),
    region: clean(row['region']),
    certifications: parseCertifications(row['certifications'] ?? ''),
    status,
    launchYear,
    description: clean(row['description']),
  };

  const searchText = [
    product.sku,
    product.name,
    product.chemicalName,
    product.function,
    product.applicationArea,
    product.region,
    ...product.certifications,
    product.description,
  ]
    .join(' ')
    .toLowerCase();

  return { ok: true, product: { ...product, searchText }, warnings };
}
