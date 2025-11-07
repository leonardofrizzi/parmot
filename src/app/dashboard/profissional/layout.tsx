"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/Sidebar"
import { ProfissionalPendenteAlert } from "@/components/ProfissionalPendenteAlert"

export default function ProfissionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profissional, setProfissional] = useState<any>(null)

  useEffect(() => {
    // Verificar autenticação
    const usuarioData = localStorage.getItem('usuario')
    const tipoUsuario = localStorage.getItem('tipoUsuario')

    if (!usuarioData || tipoUsuario !== 'profissional') {
      router.push('/login')
      return
    }

    const user = JSON.parse(usuarioData)
    setProfissional(user)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar tipo="profissional" />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {profissional && !profissional.aprovado && (
          <div className="sticky top-0 z-10 bg-gray-50 p-4 pb-0">
            <div className="max-w-7xl mx-auto">
              <ProfissionalPendenteAlert />
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
