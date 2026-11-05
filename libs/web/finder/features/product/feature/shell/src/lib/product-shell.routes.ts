import { Routes } from '@angular/router';

/**
 * Entry point of the product feature. The app mounts it at `products/:sku`; the empty child
 * path inherits that parameter, so the page reads `sku` from its own route.
 */
export const ProductRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Product Finder',
    loadComponent: () =>
      import('@pf/web-finder-features-product-feature-page').then((m) => m.ProductPage),
  },
];
