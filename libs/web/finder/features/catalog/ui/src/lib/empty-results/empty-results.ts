import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from 'primeng/button';

/** Nothing matched; offers the one way out that helps when filters are the cause. */
@Component({
  selector: 'pf-empty-results',
  imports: [ButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="icon" aria-hidden="true">
      <span class="pi pi-search"></span>
    </span>

    <h2>No products match</h2>
    <p>Try a different search term or remove some filters.</p>

    @if (canClearFilters()) {
      <button pButton type="button" [outlined]="true" (click)="clearFilters.emit()">
        <i class="pi pi-filter-slash"></i>
        Clear filters
      </button>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 3rem 1rem;
      background: var(--p-content-background);
      border: 1px dashed var(--p-surface-300);
      border-radius: var(--pf-radius);
      text-align: center;
      color: var(--p-text-muted-color);
      animation: pf-enter 0.45s var(--pf-ease) backwards;
    }
    .icon {
      display: inline-grid;
      place-items: center;
      width: 4rem;
      height: 4rem;
      background: color-mix(in srgb, var(--p-primary-color) 10%, transparent);
      border-radius: 50%;
      color: var(--p-primary-color);
    }
    .pi {
      font-size: 1.5rem;
    }
    h2 {
      margin: 0.75rem 0 0.25rem;
      font-size: 1.125rem;
      color: var(--p-text-color);
    }
    p {
      margin: 0 0 1rem;
    }
  `,
})
export class EmptyResults {
  readonly canClearFilters = input(false);
  readonly clearFilters = output<void>();
}
