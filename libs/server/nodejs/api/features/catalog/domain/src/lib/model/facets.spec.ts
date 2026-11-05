import { regionFacet, withSelected } from './facets';

describe('withSelected', () => {
  it('adds selected values that have no matches and sorts', () => {
    expect(withSelected([{ value: 'B', count: 2 }], ['A', 'B'])).toEqual([
      { value: 'A', count: 0 },
      { value: 'B', count: 2 },
    ]);
  });
});

describe('regionFacet', () => {
  const all = ['EMEA', 'Global', 'Latin America'];

  it('adds global products to each region but not the reverse', () => {
    const facet = regionFacet(
      [
        { value: 'EMEA', count: 3 },
        { value: 'Global', count: 2 },
      ],
      all,
    );
    expect(facet).toEqual([
      { value: 'EMEA', count: 5 },
      { value: 'Global', count: 2 },
      { value: 'Latin America', count: 2 },
    ]);
  });

  it('offers a region with no products of its own when global products reach it', () => {
    const facet = regionFacet([{ value: 'Global', count: 1 }], all);
    expect(facet).toContainEqual({ value: 'EMEA', count: 1 });
  });

  it('hides a region that nothing reaches, unless it is selected', () => {
    const rows = [{ value: 'EMEA', count: 1 }];
    expect(regionFacet(rows, all).map((facet) => facet.value)).toEqual(['EMEA']);
    expect(regionFacet(rows, all, ['Latin America'])).toContainEqual({
      value: 'Latin America',
      count: 0,
    });
  });
});
