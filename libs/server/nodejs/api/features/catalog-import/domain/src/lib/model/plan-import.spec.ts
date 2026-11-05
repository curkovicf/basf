import { RawRow } from './normalize-row';
import { planImport } from './plan-import';

const row = (sku: string, overrides: RawRow = {}): RawRow => ({
  sku,
  name: `Name ${sku}`,
  chemical_name: 'Lecithin',
  function: 'Emulsifier',
  application_area: 'Coatings',
  region: 'EMEA',
  certifications: '',
  status: 'Active',
  launch_year: '2020',
  description: 'Text',
  ...overrides,
});

describe('planImport', () => {
  it('lets the last row win for a conflicting duplicate and reports it', () => {
    const plan = planImport([row('P-1'), row('P-1', { status: 'Discontinued' })]);

    expect(plan.products).toHaveLength(1);
    expect(plan.products[0].status).toBe('DISCONTINUED');
    expect(plan.issues).toEqual([
      expect.objectContaining({
        line: 3,
        sku: 'P-1',
        message: expect.stringContaining('conflicts'),
      }),
    ]);
  });

  it('distinguishes an exact duplicate from a conflict', () => {
    const plan = planImport([row('P-1'), row('P-1')]);
    expect(plan.issues[0].message).toContain('exact duplicate of line 2');
  });

  it('remembers rejected SKUs, so that the import does not delist them', () => {
    const plan = planImport([row('P-1'), row('P-2', { name: '' })]);
    expect(plan.products.map((p) => p.sku)).toEqual(['P-1']);
    expect(plan.rejectedSkus).toEqual(['P-2']);
  });

  it('uses the valid row when a SKU has both a valid and a rejected one', () => {
    const plan = planImport([row('P-1'), row('P-1', { name: '' })]);
    expect(plan.products).toHaveLength(1);
    expect(plan.rejectedSkus).toEqual([]);
  });

  it('counts source lines from the header', () => {
    const plan = planImport([row('P-1', { name: '' })]);
    expect(plan.issues[0].line).toBe(2);
  });
});
