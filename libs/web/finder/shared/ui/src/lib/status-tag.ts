import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { ProductStatus } from '@pf/shared-types';
import { STATUS_LABELS, STATUS_SEVERITY } from './labels';

@Component({
  selector: 'pf-status-tag',
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p-tag [value]="label()" [severity]="severity()" [rounded]="true" />`,
})
export class StatusTag {
  readonly status = input.required<ProductStatus>();
  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
  protected readonly severity = computed(() => STATUS_SEVERITY[this.status()]);
}
