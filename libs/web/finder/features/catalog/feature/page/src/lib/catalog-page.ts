import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { ProductPageDto } from '@pf/shared-types';
import { ProductApi } from '@pf/web-finder-shared-data-access';
import { statusLabel } from '@pf/web-finder-shared-ui';
import {
  CatalogQuery,
  CatalogSort,
  EMPTY_QUERY,
  FILTER_GROUPS,
  FilterGroup,
  PAGE_SIZE,
  activeFilterCount,
  parseCatalogQuery,
  toApiParams,
  toRouteParams,
  toggleFilter,
} from '@pf/web-finder-features-catalog-util';
import {
  ActiveFilter,
  ActiveFilterChips,
  CatalogResults,
  FilterDrawer,
  FilterSidebar,
  ResultsToolbar,
  SearchBar,
  SortOption,
} from '@pf/web-finder-features-catalog-ui';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * The smart side of the catalogue: the URL is the single source of truth for the search,
 * and this component keeps it, the API and the dumb blocks in `features/catalog/ui` in step.
 */
@Component({
  selector: 'pf-catalog-page',
  imports: [
    ActiveFilterChips,
    CatalogResults,
    FilterDrawer,
    FilterSidebar,
    ResultsToolbar,
    SearchBar,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
})
export class CatalogPage {
  private readonly api = inject(ProductApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly query = toSignal(this.route.queryParamMap.pipe(map(parseCatalogQuery)), {
    initialValue: EMPTY_QUERY,
  });

  /** Follows the URL (including the back button) but can be typed into ahead of it. */
  protected readonly searchTerm = linkedSignal(() => this.query().q);

  /**
   * The search itself. A resource re-runs whenever the query signal changes and cancels the
   * request still in flight, so a slow old response can never overwrite a newer search.
   */
  private readonly search = rxResource({
    params: this.query,
    stream: ({ params }) => this.api.search(toApiParams(params)),
  });

  /** Kept while the next page loads, so that filters and results do not flicker. */
  protected readonly result = linkedSignal<ProductPageDto | undefined, ProductPageDto | null>({
    source: () => (this.search.hasValue() ? this.search.value() : undefined),
    computation: (value, previous) => value ?? previous?.value ?? null,
  });
  protected readonly loading = this.search.isLoading;
  protected readonly failed = computed(() => this.search.status() === 'error');

  protected readonly isMobile = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 899px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly filtersOpen = signal(false);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly activeFilterCount = computed(() => activeFilterCount(this.query()));

  protected readonly sortOptions = computed<SortOption[]>(() => [
    ...(this.query().q ? [{ label: 'Best match' as const, value: 'relevance' as const }] : []),
    { label: 'Name (A–Z)', value: 'name' },
    { label: 'Newest first', value: 'newest' },
    { label: 'Oldest first', value: 'oldest' },
    { label: 'Highest rated', value: 'rating' },
  ]);

  /** A flat list of the active filters, shown as removable chips above the results. */
  protected readonly activeChips = computed<ActiveFilter[]>(() => {
    const query = this.query();
    return FILTER_GROUPS.flatMap((group) =>
      query[group].map((value) => ({
        group,
        value,
        label: group === 'status' ? statusLabel(value) : value,
      })),
    );
  });

  /** Discontinued matches the default view hides; see `pf-discontinued-hint`. */
  protected readonly hiddenDiscontinued = computed(() => {
    const result = this.result();
    const isNarrowed = this.query().q !== '' || this.activeFilterCount() > 0;
    if (!result || !isNarrowed || this.query().status.length > 0) return 0;
    return result.facets.status.find((facet) => facet.value === 'DISCONTINUED')?.count ?? 0;
  });

  constructor() {
    // Typing updates the URL only once the user pauses. Each keystroke re-runs the effect, and
    // its cleanup cancels the previous timer, which is all a debounce is.
    effect((onCleanup) => {
      const typed = this.searchTerm().trim();
      if (typed === untracked(this.query).q) return;

      const timer = setTimeout(() => {
        const current = this.query();
        // "Best match" means nothing once the search has been cleared.
        const sort = !typed && current.sort === 'relevance' ? null : current.sort;
        // replaceUrl: Back should leave the search, not undo it a few letters at a time.
        this.navigate({ ...current, q: typed, sort, page: 1 }, true);
      }, SEARCH_DEBOUNCE_MS);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected onSearchInput(value: string): void {
    this.searchTerm.set(value);
  }

  protected onToggle(group: FilterGroup, value: string): void {
    this.navigate(toggleFilter(this.query(), group, value));
  }

  protected clearFilters(): void {
    const query = { ...this.query(), page: 1 };
    for (const group of FILTER_GROUPS) query[group] = [];
    this.navigate(query);
  }

  protected showDiscontinued(): void {
    this.navigate({ ...this.query(), status: ['DISCONTINUED'], page: 1 });
  }

  protected onSort(sort: CatalogSort): void {
    this.navigate({ ...this.query(), sort, page: 1 });
  }

  protected onPage(page: number): void {
    this.navigate({ ...this.query(), page });
    window.scrollTo({ top: 0 });
  }

  protected retry(): void {
    this.search.reload();
  }

  private navigate(query: CatalogQuery, replaceUrl = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toRouteParams(query),
      replaceUrl,
    });
  }
}
