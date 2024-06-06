import Cookies from 'js-cookie';
import { parseCookies } from 'nookies';

import { COOKIE_KEY } from '@/lib/constants';

export const setToken = (token: string, storeInCookie?: boolean) => {
  if (token) {
    localStorage.setItem(COOKIE_KEY, token);
    if (storeInCookie && token) {
      Cookies.set(COOKIE_KEY, token, {
        secure: process.env.NEXT_PUBLIC_APP_ENV === 'production',
        expires: 30,
        sameSite: 'strict',
      });
    }
  }
};

export function isAuthenticatedUser() {
  const token = localStorage.getItem(COOKIE_KEY);
  return token ? true : false;
}

export function getUserToken(): string | null {
  const token = localStorage.getItem(COOKIE_KEY);
  return token ? token : null;
}

export function removeToken() {
  Cookies.remove(COOKIE_KEY);
  localStorage.removeItem(COOKIE_KEY);
}

export const hasAuthenticationCookie = (context: any) => {
  const cookies = parseCookies(context);
  return !!cookies[COOKIE_KEY];
};

export const extractCookieFromCtx = (context: any) => {
  const cookies = parseCookies(context);
  return cookies[COOKIE_KEY];
};
