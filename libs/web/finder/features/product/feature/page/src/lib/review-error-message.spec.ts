import { HttpErrorResponse } from '@angular/common/http';
import { reviewErrorMessage } from './review-error-message';

describe('reviewErrorMessage', () => {
  it.each([
    [400, 'check your review'],
    [409, 'closed'],
    [429, 'wait a minute'],
    [500, "couldn't save"],
  ])('explains an HTTP %i in plain language', (status, fragment) => {
    expect(reviewErrorMessage(new HttpErrorResponse({ status }))).toContain(fragment);
  });

  it('falls back to a generic message for a non-HTTP failure', () => {
    expect(reviewErrorMessage(new Error('offline'))).toContain("couldn't save");
  });
});
