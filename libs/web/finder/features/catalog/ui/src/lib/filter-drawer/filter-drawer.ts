import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { ProductFacetsDto } from '@pf/shared-types';
import { CatalogQuery, FilterGroup } from '@pf/web-finder-features-catalog-util';
import { FilterPanel } from '../filter-panel/filter-panel';

/** The filter panel in a bottom sheet, for phones. Closes with a button that says what it shows. */
@Component({
  selector: 'pf-filter-drawer',
  imports: [ButtonDirective, DrawerModule, FilterPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-drawer.html',
})
export class FilterDrawer {
  readonly open = input.required<boolean>();
  readonly facets = input.required<ProductFacetsDto>();
  readonly query = input.required<CatalogQuery>();
  readonly total = input.required<number>();
  readonly openChange = output<boolean>();
  readonly toggled = output<{ group: FilterGroup; value: string }>();
  readonly cleared = output<void>();
}
