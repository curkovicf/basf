import { expandRegions, resolveSort } from './product-search';

describe('expandRegions', () => {
  it('adds Global once', () => {
    expect(expandRegions(['EMEA', 'Global'])).toEqual(['EMEA', 'Global']);
  });
});

describe('resolveSort', () => {
  it('defaults to relevance when searching and name otherwise', () => {
    expect(resolveSort({ q: 'x' })).toBe('relevance');
    expect(resolveSort({})).toBe('name');
  });

  it('falls back from relevance when there is nothing to be relevant to', () => {
    expect(resolveSort({ sort: 'relevance' })).toBe('name');
  });
});
