import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'pf-review-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="stars" [attr.aria-label]="rating() + ' out of 5 stars'">
      @for (star of stars; track star) {
        <span
          class="pi"
          [class.pi-star-fill]="star <= rating()"
          [class.pi-star]="star > rating()"
          aria-hidden="true"
        ></span>
      }
    </span>
  `,
  styles: `
    .stars {
      display: inline-flex;
      gap: 0.125rem;
      color: var(--pf-star);
      font-size: 0.875rem;
    }
  `,
})
export class ReviewStars {
  readonly rating = input.required<number>();
  protected readonly stars = [1, 2, 3, 4, 5];
}
