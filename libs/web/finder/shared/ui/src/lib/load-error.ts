import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { MessageModule } from 'primeng/message';

/** "Something didn't load" with the one action that helps: trying again. */
@Component({
  selector: 'pf-load-error',
  imports: [ButtonDirective, MessageModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-message severity="error" animate.enter="pf-enter">
      <div class="content">
        <span>{{ message() }}</span>

        <button pButton type="button" size="small" (click)="retry.emit()">
          <i class="pi pi-refresh"></i>
          Retry
        </button>
      </div>
    </p-message>
  `,
  styles: `
    .content {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }
  `,
})
export class LoadError {
  readonly message = input.required<string>();
  readonly retry = output<void>();
}
