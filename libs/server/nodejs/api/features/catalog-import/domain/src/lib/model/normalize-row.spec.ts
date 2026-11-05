import {
  RawRow,
  normalizeRow,
  parseCertifications,
  parseLaunchYear,
  parseStatus,
} from './normalize-row';

const row = (overrides: RawRow = {}): RawRow => ({
  sku: 'P-1',
  name: 'Name',
  chemical_name: 'Lecithin',
  function: 'Emulsifier',
  application_area: 'Food & Nutrition',
  region: 'EMEA',
  certifications: 'Vegan',
  status: 'Active',
  launch_year: '2020',
  description: 'Text',
  ...overrides,
});

describe('parseStatus', () => {
  it.each([
    ['Active', 'ACTIVE'],
    ['active', 'ACTIVE'],
    ['ACTIVE', 'ACTIVE'],
    [' Active ', 'ACTIVE'],
    ['Phase-out', 'PHASE_OUT'],
    ['Phase out', 'PHASE_OUT'],
    ['PHASE_OUT', 'PHASE_OUT'],
    ['Discontinued', 'DISCONTINUED'],
  ])('maps %j to %s', (input, expected) => {
    expect(parseStatus(input)).toBe(expected);
  });

  it.each(['', 'Banana', 'Inactive'])('refuses to guess at %j', (input) => {
    expect(parseStatus(input)).toBeNull();
  });
});

describe('parseLaunchYear', () => {
  const now = new Date('2026-06-01');

  it.each([
    ['2020', 2020],
    [' 2020 ', 2020],
    ['2027', 2027],
    ['', null],
    ['n/a', null],
    ['20', null],
    ['1850', null],
    ['2031', null],
    ['2020.5', null],
  ])('reads %j as %s', (input, expected) => {
    expect(parseLaunchYear(input, now)).toBe(expected);
  });
});

describe('parseCertifications', () => {
  it('splits, trims, de-duplicates and sorts', () => {
    expect(parseCertifications(' Vegan | Halal|Vegan||')).toEqual(['Halal', 'Vegan']);
  });

  it('reads an empty value as no certifications', () => {
    expect(parseCertifications('')).toEqual([]);
  });
});

describe('normalizeRow', () => {
  it('trims and collapses whitespace in text', () => {
    const result = normalizeRow(row({ name: '  Puraxin   SF 120 ', region: ' EMEA ' }));
    expect(result).toMatchObject({ ok: true, product: { name: 'Puraxin SF 120', region: 'EMEA' } });
  });

  it('upper-cases the SKU, the business key', () => {
    expect(normalizeRow(row({ sku: ' p-1 ' }))).toMatchObject({ product: { sku: 'P-1' } });
  });

  it('keeps a product with a bad year, and warns', () => {
    const result = normalizeRow(row({ launch_year: 'n/a' }));
    expect(result).toMatchObject({ ok: true, product: { launchYear: null } });
    expect(result.ok && result.warnings).toHaveLength(1);
  });

  it('builds lower-case search text from all searchable fields', () => {
    const result = normalizeRow(row());
    expect(result.ok && result.product.searchText).toBe(
      'p-1 name lecithin emulsifier food & nutrition emea vegan text',
    );
  });

  it.each([
    ['name', { name: '  ' }, 'missing name'],
    ['status', { status: 'Banana' }, 'unknown status "Banana"'],
  ])('rejects a row with a bad %s but still reports its SKU', (_field, overrides, reason) => {
    expect(normalizeRow(row(overrides))).toEqual({ ok: false, sku: 'P-1', reason });
  });

  it('rejects a row without a SKU', () => {
    expect(normalizeRow(row({ sku: '' }))).toEqual({ ok: false, sku: null, reason: 'missing sku' });
  });
});
