'use server'

import { redirect } from 'next/navigation'
import { clearSession } from '@/app/lib/session'

export async function logoutAction(): Promise<void> {
  await clearSession()
  redirect('/login')
}
