export class ReviewsDI {
  /** Reads/writes `reviews` and the rating totals on `products`. */
  public static readonly ReviewRepository: unique symbol = Symbol('ReviewRepository');
  /** Looks a product up for the review flow. */
  public static readonly ReviewProductRepository: unique symbol = Symbol('ReviewProductRepository');
}
