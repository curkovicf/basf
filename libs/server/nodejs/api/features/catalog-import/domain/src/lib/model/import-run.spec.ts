import { ImportAbortedError, assertExportLooksComplete } from './import-run';

describe('assertExportLooksComplete', () => {
  it('refuses an export without products, even with force', () => {
    expect(() => assertExportLooksComplete(0, 0, { force: true })).toThrow(ImportAbortedError);
  });

  it('refuses an export that would remove more than half of the catalogue', () => {
    expect(() => assertExportLooksComplete(1, 4, {})).toThrow(/truncated/);
  });

  it('accepts a real reduction with force, and any export on an empty catalogue', () => {
    expect(() => assertExportLooksComplete(1, 4, { force: true })).not.toThrow();
    expect(() => assertExportLooksComplete(1, 0, {})).not.toThrow();
  });
});
