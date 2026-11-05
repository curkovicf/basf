import { convertToParamMap } from '@angular/router';
import {
  EMPTY_QUERY,
  activeFilterCount,
  parseCatalogQuery,
  toApiParams,
  toRouteParams,
  toggleFilter,
} from './catalog-query';

const parse = (params: Record<string, string | string[]>) =>
  parseCatalogQuery(convertToParamMap(params));

describe('parseCatalogQuery', () => {
  it('reads a full query, including repeated params', () => {
    expect(
      parse({
        q: 'lecithin',
        function: ['Solvent', 'Polymer'],
        region: 'EMEA',
        sort: 'rating',
        page: '3',
      }),
    ).toEqual({
      ...EMPTY_QUERY,
      q: 'lecithin',
      function: ['Solvent', 'Polymer'],
      region: ['EMEA'],
      sort: 'rating',
      page: 3,
    });
  });

  it.each([
    ['page', { page: 'abc' }],
    ['negative page', { page: '-2' }],
    ['zero page', { page: '0' }],
    ['fractional page', { page: '1.5' }],
    ['sort', { sort: 'bogus' }],
    ['status', { status: 'DELETED' }],
  ])(
    'falls back to the default for a bad %s, rather than breaking a shared link',
    (_label, params) => {
      expect(parse(params)).toEqual(EMPTY_QUERY);
    },
  );

  it('caps the search length at what the API accepts', () => {
    expect(parse({ q: 'x'.repeat(500) }).q).toHaveLength(100);
  });
});

describe('toRouteParams', () => {
  it('removes defaults, so that links stay short', () => {
    expect(toRouteParams(EMPTY_QUERY)).toEqual({
      q: null,
      sort: null,
      page: null,
      function: null,
      applicationArea: null,
      region: null,
      certification: null,
      status: null,
    });
  });

  it('round-trips through the URL without loss', () => {
    const query = {
      ...EMPTY_QUERY,
      q: 'food & nutrition',
      applicationArea: ['Food & Nutrition'],
      certification: ['Vegan', 'Halal'],
      status: ['DISCONTINUED'],
      sort: 'newest' as const,
      page: 4,
    };
    const params = Object.fromEntries(
      Object.entries(toRouteParams(query)).filter(([, value]) => value !== null),
    );
    expect(parseCatalogQuery(convertToParamMap(params))).toEqual(query);
  });
});

describe('toApiParams', () => {
  it('sends only what is set, plus the page window', () => {
    expect(toApiParams({ ...EMPTY_QUERY, q: 'x', region: ['EMEA'] })).toEqual({
      page: 1,
      pageSize: 20,
      q: 'x',
      region: ['EMEA'],
    });
  });
});

describe('toggleFilter', () => {
  it('adds and removes a value and resets to page 1', () => {
    const added = toggleFilter({ ...EMPTY_QUERY, page: 5 }, 'region', 'EMEA');
    expect(added).toMatchObject({ region: ['EMEA'], page: 1 });

    const removed = toggleFilter({ ...added, page: 2 }, 'region', 'EMEA');
    expect(removed).toMatchObject({ region: [], page: 1 });
  });

  it('counts active filters across groups', () => {
    expect(
      activeFilterCount({ ...EMPTY_QUERY, region: ['EMEA'], status: ['ACTIVE', 'PHASE_OUT'] }),
    ).toBe(3);
  });
});
