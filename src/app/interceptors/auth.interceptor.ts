import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Grab the token from localStorage
  const token = localStorage.getItem('vault_token');

  // 2. If the token exists, clone the request and add the Authorization header
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // 3. If no token, just let the request pass through (e.g., for login/register)
  return next(req);
};
