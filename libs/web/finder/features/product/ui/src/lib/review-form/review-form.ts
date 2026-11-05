import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormField, form, maxLength, required, validate } from '@angular/forms/signals';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { CreateReviewRequest, REVIEW_LIMITS } from '@pf/shared-types';

/** Where the parent's submission stands; the form only reflects it. */
export type ReviewSubmitStatus = 'idle' | 'submitting' | 'error' | 'success';

interface ReviewFormModel {
  rating: number | null;
  authorName: string;
  comment: string;
}

const EMPTY_REVIEW: ReviewFormModel = { rating: null, authorName: '', comment: '' };

/** Whitespace-only input must fail here too, as the API trims before validating. */
const notBlank = (min: number) => (context: { value: () => string }) =>
  context.value().trim().length >= min ? null : { kind: 'tooShort' };

/**
 * Collects and validates a review, then hands the trimmed values up. Saving it is the
 * parent's job; the outcome comes back through `status` and `errorMessage`.
 */
@Component({
  selector: 'pf-review-form',
  imports: [
    FormField,
    ButtonDirective,
    InputTextModule,
    MessageModule,
    RatingModule,
    TextareaModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-form.html',
  styleUrl: './review-form.scss',
})
export class ReviewForm {
  readonly status = input<ReviewSubmitStatus>('idle');
  readonly errorMessage = input<string | null>(null);
  readonly submitted = output<CreateReviewRequest>();

  protected readonly attempted = signal(false);

  protected readonly model = signal<ReviewFormModel>({ ...EMPTY_REVIEW });

  /** Signal form: the model is the single source of truth and validity is derived from it. */
  protected readonly form = form(this.model, (path) => {
    required(path.rating);
    validate(path.authorName, notBlank(REVIEW_LIMITS.authorName.min));
    maxLength(path.authorName, REVIEW_LIMITS.authorName.max);
    validate(path.comment, notBlank(REVIEW_LIMITS.comment.min));
    maxLength(path.comment, REVIEW_LIMITS.comment.max);
  });

  constructor() {
    effect(() => {
      if (this.status() === 'success') {
        this.form().reset({ ...EMPTY_REVIEW });
        this.attempted.set(false);
      }
    });
  }

  protected showError(field: 'rating' | 'authorName' | 'comment'): boolean {
    const state = this.form[field]();
    return state.invalid() && (state.touched() || this.attempted());
  }

  protected submit(): void {
    this.attempted.set(true);
    if (this.form().invalid() || this.status() === 'submitting') return;

    const { rating, authorName, comment } = this.model();
    this.submitted.emit({
      rating: rating as number,
      authorName: authorName.trim(),
      comment: comment.trim(),
    });
  }
}
