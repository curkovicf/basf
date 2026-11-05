import { Routes } from '@angular/router';

/** Each feature's shell owns its routes; the app only chooses the mount points. */
export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  {
    path: 'products',
    loadChildren: () =>
      import('@pf/web-finder-features-catalog-feature-shell').then((m) => m.CatalogRoutes),
  },
  {
    path: 'products/:sku',
    loadChildren: () =>
      import('@pf/web-finder-features-product-feature-shell').then((m) => m.ProductRoutes),
  },
  { path: '**', redirectTo: 'products' },
];
