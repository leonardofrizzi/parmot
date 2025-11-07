"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import AdminSidebar from "@/components/AdminSidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Não verificar autenticação na página de login
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    // Verificar autenticação para outras páginas admin
    const adminData = localStorage.getItem('admin')

    if (!adminData) {
      router.push('/admin/login')
      return
    }

    setLoading(false)
  }, [router, pathname])

  // Página de login não usa o layout com sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
