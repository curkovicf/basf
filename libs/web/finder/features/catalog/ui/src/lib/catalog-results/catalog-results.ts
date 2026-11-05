import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ProductPageDto } from '@pf/shared-types';
import { LoadError } from '@pf/web-finder-shared-ui';
import { DiscontinuedHint } from '../discontinued-hint/discontinued-hint';
import { EmptyResults } from '../empty-results/empty-results';
import { ProductList } from '../product-list/product-list';

/**
 * Everything below the toolbar: the list and its paging, or whichever state replaces it
 * (loading placeholders, nothing matched, loading failed).
 */
@Component({
  selector: 'pf-catalog-results',
  imports: [PaginatorModule, LoadError, DiscontinuedHint, EmptyResults, ProductList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog-results.html',
})
export class CatalogResults {
  /** `null` until the first page has arrived. */
  readonly result = input.required<ProductPageDto | null>();
  readonly loading = input(false);
  readonly failed = input(false);
  /** Discontinued matches hidden by the default view; 0 hides the hint. */
  readonly hiddenDiscontinued = input(0);
  readonly canClearFilters = input(false);
  readonly page = input(1);
  readonly pageSize = input.required<number>();
  /** Fewer page links on narrow screens. */
  readonly compact = input(false);

  readonly retry = output<void>();
  readonly showDiscontinued = output<void>();
  readonly clearFilters = output<void>();
  readonly pageChange = output<number>();

  protected readonly firstRow = computed(() => (this.page() - 1) * this.pageSize());

  protected onPage(state: PaginatorState): void {
    const page = Math.floor((state.first ?? 0) / this.pageSize()) + 1;
    if (page !== this.page()) this.pageChange.emit(page);
  }
}
