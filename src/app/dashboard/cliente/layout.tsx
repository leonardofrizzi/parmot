"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/Sidebar"

export default function ClienteDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const tipoUsuario = localStorage.getItem('tipoUsuario')

    if (tipoUsuario !== 'cliente') {
      router.push('/login')
      return
    }

    setIsAuthenticated(true)
  }, [router])

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar tipo="cliente" />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}
