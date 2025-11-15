// src/app/admin/dashboard/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClient from './ClientDashboard'

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase_session')?.value

  if (!token) {
    redirect('/login')
  }

  return <DashboardClient />
}
