import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { catchError, of } from 'rxjs';
import { ProductApi } from '@pf/web-finder-shared-data-access';

@Component({
  selector: 'pf-root',
  imports: [DatePipe, RouterLink, RouterOutlet, ToastModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main">Skip to content</a>

    <header class="app-header">
      <div class="app-header-inner">
        <a routerLink="/products" class="brand">
          <span class="brand-mark" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 3h6M10 3v6.2L4.6 18.4A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-2.6L14 9.2V3" />
              <path d="M7.5 15h9" />
            </svg>
          </span>
          Product Finder
        </a>

        <span class="tagline">Specialty chemicals catalogue</span>
      </div>
    </header>

    <main id="main" class="app-main">
      <router-outlet />
    </main>

    <footer class="app-footer">
      @if (catalogStatus()?.lastImportAt; as updated) {
        <span class="fresh" animate.enter="pf-fade">
          <span class="dot" aria-hidden="true"></span>
          Catalogue updated {{ updated | date: 'medium' }}
        </span>
      }
    </footer>

    <p-toast position="bottom-center" />
  `,
  styleUrl: './app.component.scss',
})
export class App {
  protected readonly catalogStatus = toSignal(
    inject(ProductApi)
      .catalogStatus()
      .pipe(catchError(() => of(null))),
  );
}
