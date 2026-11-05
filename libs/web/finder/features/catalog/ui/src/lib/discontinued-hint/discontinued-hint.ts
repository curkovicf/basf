import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * A customer searching an old product name should learn that it was discontinued, not
 * conclude that it never existed.
 */
@Component({
  selector: 'pf-discontinued-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p animate.enter="pf-enter">
      <span class="pi pi-info-circle" aria-hidden="true"></span>
      {{ count() }} discontinued
      {{ count() === 1 ? 'product also matches' : 'products also match' }}.
      <button type="button" class="link" (click)="show.emit()">Show them</button>
    </p>
  `,
  styles: `
    p {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.875rem;
      padding: 0.625rem 0.875rem;
      background: color-mix(in srgb, var(--p-orange-500) 9%, var(--p-content-background));
      border: 1px solid color-mix(in srgb, var(--p-orange-500) 28%, transparent);
      border-radius: var(--pf-radius-sm);
      color: var(--p-text-color);
      font-size: 0.875rem;
    }
    .pi {
      color: var(--p-orange-500);
    }
    .link {
      padding: 0;
      background: none;
      border: 0;
      color: var(--p-primary-color);
      font: inherit;
      font-weight: 600;
      text-decoration: underline;
      cursor: pointer;
    }
  `,
})
export class DiscontinuedHint {
  readonly count = input.required<number>();
  readonly show = output<void>();
}
