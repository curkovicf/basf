import { HttpErrorResponse } from '@angular/common/http';

/** Turns the API's answer to a failed review into a sentence the customer can act on. */
export function reviewErrorMessage(error: unknown): string {
  const status = error instanceof HttpErrorResponse ? error.status : 0;
  switch (status) {
    case 400:
      return 'Please check your review and try again.';
    case 409:
      return 'Reviews are closed for this product.';
    case 429:
      return "You've posted several reviews in a short time. Please wait a minute and try again.";
    default:
      return "We couldn't save your review. Please try again.";
  }
}
