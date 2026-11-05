import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ProductFacetsDto } from '@pf/shared-types';
import { statusLabel } from '@pf/web-finder-shared-ui';
import { CatalogQuery, FilterGroup, activeFilterCount } from '@pf/web-finder-features-catalog-util';

interface GroupDefinition {
  key: FilterGroup;
  title: string;
  hint?: string;
}

@Component({
  selector: 'pf-filter-panel',
  imports: [FormsModule, ButtonDirective, CheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.scss',
})
export class FilterPanel {
  readonly facets = input.required<ProductFacetsDto>();
  readonly query = input.required<CatalogQuery>();
  readonly toggled = output<{ group: FilterGroup; value: string }>();
  readonly cleared = output<void>();

  protected readonly activeFilterCount = activeFilterCount;

  protected readonly groups: GroupDefinition[] = [
    { key: 'function', title: 'Function' },
    { key: 'applicationArea', title: 'Application area' },
    { key: 'region', title: 'Region', hint: 'Includes products sold globally.' },
    { key: 'certification', title: 'Certifications', hint: 'Products must have all selected.' },
    {
      key: 'status',
      title: 'Availability',
      hint: 'Discontinued products are hidden unless selected.',
    },
  ];

  protected label(group: FilterGroup, value: string): string {
    return group === 'status' ? statusLabel(value) : value;
  }

  protected isSelected(group: FilterGroup, value: string): boolean {
    return this.query()[group].includes(value);
  }
}
