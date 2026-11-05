import { searchPatterns } from './product-sql';

describe('searchPatterns', () => {
  it('makes one lower-case pattern per word', () => {
    expect(searchPatterns('  Quorin  SF ')).toEqual(['%quorin%', '%sf%']);
  });

  it('escapes LIKE wildcards in user input', () => {
    expect(searchPatterns('50%_a\\b')).toEqual(['%50\\%\\_a\\\\b%']);
  });

  it('is empty without a query', () => {
    expect(searchPatterns(undefined)).toEqual([]);
  });

  it('caps the number of words, bounding the query cost', () => {
    expect(searchPatterns('a b c d e f g h i j')).toHaveLength(8);
  });
});
