import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RatingSummaryDto } from '@pf/shared-types';

@Component({
  selector: 'pf-rating-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rating().average; as average) {
      <span
        class="rating"
        [attr.aria-label]="average + ' out of 5 from ' + rating().count + ' reviews'"
      >
        <span class="pi pi-star-fill star" aria-hidden="true"></span>

        <strong>{{ average }}</strong>
        <span class="count">({{ rating().count }})</span>
      </span>
    } @else {
      <span class="none">No reviews yet</span>
    }
  `,
  styles: `
    .rating {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.6rem;
      background: color-mix(in srgb, var(--pf-star) 12%, transparent);
      border-radius: 2rem;
      font-size: 0.875rem;
    }
    .star {
      color: var(--pf-star);
      font-size: 0.8125rem;
    }
    .count {
      color: var(--p-text-muted-color);
      font-size: 0.8125rem;
    }
    .none {
      color: var(--p-text-muted-color);
      font-size: 0.8125rem;
    }
  `,
})
export class RatingBadge {
  readonly rating = input.required<RatingSummaryDto>();
}
