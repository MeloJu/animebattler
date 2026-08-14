import { redirect } from 'next/navigation'
import { getSessionUser } from '@/app/lib/auth'

// Session-backed current user
export async function getCurrentUser() {
  return getSessionUser()
}

// Same as getCurrentUser(), but for the ~16 call sites that only make sense
// for a logged-in visitor (a page or action behind auth) — bails out to
// /login instead of making every caller repeat the null-check.
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
