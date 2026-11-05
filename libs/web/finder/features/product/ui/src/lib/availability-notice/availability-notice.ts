import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { ProductStatus } from '@pf/shared-types';

/** Warns when a product is on its way out or gone. Renders nothing for an active product. */
@Component({
  selector: 'pf-availability-notice',
  imports: [MessageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (status()) {
      @case ('DISCONTINUED') {
        <p-message severity="error">
          <strong>No longer sold.</strong> This product has been discontinued and can't be ordered.
          The information below is kept for reference.
        </p-message>
      }

      @case ('PHASE_OUT') {
        <p-message severity="warn">
          <strong>Being phased out.</strong> Availability may be limited. Please check with your
          sales contact before planning long-term use.
        </p-message>
      }
    }
  `,
})
export class AvailabilityNotice {
  readonly status = input.required<ProductStatus>();
}
