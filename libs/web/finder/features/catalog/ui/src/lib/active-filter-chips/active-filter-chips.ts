import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ChipModule } from 'primeng/chip';
import { FilterGroup } from '@pf/web-finder-features-catalog-util';

/** One selected filter value, with the label the user saw when picking it. */
export interface ActiveFilter {
  group: FilterGroup;
  value: string;
  label: string;
}

/** The selected filters as removable chips, so they can be undone without opening the panel. */
@Component({
  selector: 'pf-active-filter-chips',
  imports: [ChipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (chip of chips(); track chip.group + chip.value) {
      <p-chip
        [label]="chip.label"
        [removable]="true"
        animate.enter="pf-enter"
        animate.leave="pf-leave"
        (onRemove)="removed.emit(chip)"
      />
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-bottom: 0.875rem;
    }
  `,
})
export class ActiveFilterChips {
  readonly chips = input.required<ActiveFilter[]>();
  readonly removed = output<ActiveFilter>();
}
