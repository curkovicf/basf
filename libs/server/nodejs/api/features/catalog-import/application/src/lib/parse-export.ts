import { parse } from 'csv-parse/sync';
import { RawRow, REQUIRED_COLUMNS } from '@pf/server-nodejs-api-features-catalog-import-domain';

/**
 * Structural problems (wrong header, a row with the wrong number of columns, which
 * is how a cut-off file usually looks) throw and abort the run. Row-level content
 * problems are handled later, row by row, by planImport.
 */
export function parseExport(csv: string): RawRow[] {
  const rows: RawRow[] = parse(csv, {
    bom: true,
    columns: (header: string[]) => {
      const columns = header.map((column) => column.trim().toLowerCase());
      const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
      if (missing.length > 0) {
        throw new Error(`export is missing columns: ${missing.join(', ')}`);
      }
      return columns;
    },
    skip_empty_lines: true,
  });
  return rows;
}
