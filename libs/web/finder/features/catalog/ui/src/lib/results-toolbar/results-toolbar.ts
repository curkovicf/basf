import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { CatalogSort } from '@pf/web-finder-features-catalog-util';

export interface SortOption {
  label: string;
  value: CatalogSort;
}

/** Result count on the left, the filter button (phones only) and sort on the right. */
@Component({
  selector: 'pf-results-toolbar',
  imports: [FormsModule, ButtonDirective, SelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results-toolbar.html',
  styleUrl: './results-toolbar.scss',
})
export class ResultsToolbar {
  /** `null` while the first page is still loading. */
  readonly total = input.required<number | null>();
  readonly sort = input.required<CatalogSort | null>();
  readonly sortOptions = input.required<SortOption[]>();
  readonly filterButton = input(false);
  readonly activeFilterCount = input(0);
  readonly openFilters = output<void>();
  readonly sortChange = output<CatalogSort>();
}
