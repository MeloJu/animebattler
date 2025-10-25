import { getSessionUser } from '@/app/lib/auth'

// Session-backed current user
export async function getCurrentUser() {
  return getSessionUser()
}
