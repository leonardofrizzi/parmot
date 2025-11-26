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

  // Páginas públicas do admin (sem autenticação)
  const publicPages = ['/admin/login', '/admin/configurar']
  const isPublicPage = publicPages.includes(pathname)

  useEffect(() => {
    // Não verificar autenticação em páginas públicas
    if (isPublicPage) {
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
  }, [router, pathname, isPublicPage])

  // Páginas públicas não usam o layout com sidebar
  if (isPublicPage) {
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
