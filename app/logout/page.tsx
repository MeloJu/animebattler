import { redirect } from 'next/navigation'
import { clearSession } from '@/app/lib/auth'

export default async function LogoutPage() {
  await clearSession()
  redirect('/login')
}
