import { NormalizedProduct, RawRow, normalizeRow } from './normalize-row';

export interface ImportIssue {
  /** Line number in the source file (the header is line 1). */
  line: number;
  sku: string | null;
  severity: 'warning' | 'rejected';
  message: string;
}

export interface ImportPlan {
  rowsRead: number;
  products: NormalizedProduct[];
  /**
   * SKUs on rejected rows. They are still present in the PIM, so an existing
   * product with such a SKU must keep its last good data rather than be delisted.
   */
  rejectedSkus: string[];
  issues: ImportIssue[];
}

/**
 * Turns raw rows into what should be written. A repeated SKU keeps the last row,
 * on the assumption that an export is written in change order; conflicting
 * duplicates are reported so that the PIM owner can fix the source.
 */
export function planImport(rows: Iterable<RawRow>): ImportPlan {
  const bySku = new Map<string, { product: NormalizedProduct; line: number }>();
  const rejected = new Set<string>();
  const issues: ImportIssue[] = [];
  let rowsRead = 0;

  for (const row of rows) {
    rowsRead += 1;
    const line = rowsRead + 1;
    const result = normalizeRow(row);

    if (!result.ok) {
      issues.push({ line, sku: result.sku, severity: 'rejected', message: result.reason });
      if (result.sku) rejected.add(result.sku);
      continue;
    }

    const { product, warnings } = result;
    for (const message of warnings) {
      issues.push({ line, sku: product.sku, severity: 'warning', message });
    }

    const previous = bySku.get(product.sku);
    if (previous) {
      const identical = JSON.stringify(previous.product) === JSON.stringify(product);
      issues.push({
        line,
        sku: product.sku,
        severity: 'warning',
        message: identical
          ? `exact duplicate of line ${previous.line}`
          : `conflicts with line ${previous.line}; this later row wins`,
      });
    }
    bySku.set(product.sku, { product, line });
  }

  // A valid row elsewhere in the file takes precedence over a rejected one.
  for (const sku of bySku.keys()) rejected.delete(sku);

  return {
    rowsRead,
    products: [...bySku.values()].map((entry) => entry.product),
    rejectedSkus: [...rejected],
    issues,
  };
}
