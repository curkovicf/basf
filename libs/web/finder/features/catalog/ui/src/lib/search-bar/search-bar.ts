import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

/** The page title and the one input every visit starts with. Emits every keystroke. */
@Component({
  selector: 'pf-search-bar',
  imports: [IconFieldModule, InputIconModule, InputTextModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class SearchBar {
  readonly term = input.required<string>();
  readonly termChange = output<string>();

  protected onInput(event: Event): void {
    this.termChange.emit((event.target as HTMLInputElement).value);
  }
}
