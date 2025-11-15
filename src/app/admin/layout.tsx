// src/app/admin/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import React, { ReactNode } from 'react'

export const metadata = {
  title: 'AdminHub – Secure Area',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 1. Read the cookie store (server-side)
  const store = await cookies()
  const token = store.get('admin_token')?.value

  // 2. If no token, redirect immediately to /login
  if (!token) {
    redirect('/login')
  }

  // 3. Otherwise render the admin subtree
  return (
    <>
      {children}
    </>
  )
}
