// Plain helpers shared by login/register's pages and their server actions.
// Can't live in auth-actions.ts: a 'use server' file may only export async
// functions, and MIN_PASSWORD_LENGTH/sanitizeRedirectTarget are a constant
// and a sync function.
export const MIN_PASSWORD_LENGTH = 8

export function sanitizeRedirectTarget(target: string): string {
  if (target.startsWith('/') && !target.startsWith('//')) return target
  return '/select'
}
