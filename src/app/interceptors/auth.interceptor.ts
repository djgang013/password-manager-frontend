import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Check if we are running in the browser, NOT the Node.js server
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    // 2. We are in the browser! It is safe to use localStorage
    const token = localStorage.getItem('vault_token');

    // 3. If the token exists, clone the request and add the Authorization header
    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(cloned);
    }
  }

  // 4. If no token or running on the server, just let the request pass through
  return next(req);
};
