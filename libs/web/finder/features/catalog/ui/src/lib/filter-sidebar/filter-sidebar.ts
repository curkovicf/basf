import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ProductFacetsDto } from '@pf/shared-types';
import { CatalogQuery, FilterGroup } from '@pf/web-finder-features-catalog-util';
import { FilterPanel } from '../filter-panel/filter-panel';

/** The filter panel as a desktop sidebar; `pf-filter-drawer` is its phone counterpart. */
@Component({
  selector: 'pf-filter-sidebar',
  imports: [FilterPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside aria-label="Filters">
      <pf-filter-panel
        [facets]="facets()"
        [query]="query()"
        (toggled)="toggled.emit($event)"
        (cleared)="cleared.emit()"
      />
    </aside>
  `,
  styles: `
    aside {
      // Stays in view while the results scroll, below the sticky header.
      position: sticky;
      top: calc(var(--pf-header-height) + 1rem);
      max-height: calc(100vh - var(--pf-header-height) - 2rem);
      overflow-y: auto;
      padding: 1.125rem 1.25rem;
      background: var(--p-content-background);
      border: 1px solid var(--p-content-border-color);
      border-radius: var(--pf-radius);
      box-shadow: var(--pf-shadow-sm);
      animation: pf-fade 0.4s ease-out backwards;
    }
  `,
})
export class FilterSidebar {
  readonly facets = input.required<ProductFacetsDto>();
  readonly query = input.required<CatalogQuery>();
  readonly toggled = output<{ group: FilterGroup; value: string }>();
  readonly cleared = output<void>();
}
