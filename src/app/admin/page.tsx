"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminIndex() {
  const router = useRouter()

  useEffect(() => {
    // Verificar se admin está logado
    const adminData = localStorage.getItem('admin')

    if (adminData) {
      // Se está logado, vai pro dashboard
      router.replace('/admin/dashboard')
    } else {
      // Se não está logado, vai pro login
      router.replace('/admin/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Redirecionando...</p>
    </div>
  )
}
