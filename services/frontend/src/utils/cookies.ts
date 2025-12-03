/**
 * Cookie utilities for cross-port authentication
 * Cookies are shared across all ports on the same domain/IP
 */

export function setCookie(name: string, value: string, days: number = 7): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  // Use domain without port to share across all ports on same IP
  const domain = window.location.hostname;
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;domain=${domain};SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function deleteCookie(name: string): void {
  const domain = window.location.hostname;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`;
}

// Auth-specific helpers
export function getAuthToken(): string | null {
  // Try cookie first
  const cookieToken = getCookie('auth_token');
  if (cookieToken) return cookieToken;
  
  // Fallback to localStorage for backward compatibility
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
  setCookie('auth_token', token, 7);
  localStorage.setItem('auth_token', token); // Also save to localStorage as backup
}

export function getAuthUser(): any | null {
  // Try cookie first
  const cookieUser = getCookie('app_user');
  if (cookieUser) {
    try {
      return JSON.parse(decodeURIComponent(cookieUser));
    } catch (error) {
      console.error('Error parsing user from cookie:', error);
    }
  }
  
  // Fallback to localStorage
  const localUser = localStorage.getItem('app_user');
  if (localUser) {
    try {
      return JSON.parse(localUser);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
  }
  
  return null;
}

export function setAuthUser(user: any): void {
  const userJson = JSON.stringify(user);
  setCookie('app_user', encodeURIComponent(userJson), 7);
  localStorage.setItem('app_user', userJson); // Also save to localStorage as backup
}

export function clearAuth(): void {
  deleteCookie('auth_token');
  deleteCookie('app_user');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('app_user');
}
