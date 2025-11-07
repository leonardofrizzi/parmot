"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, FileText, DollarSign, CheckCircle2, Clock, XCircle, UserCheck, Shield } from "lucide-react"

interface Stats {
  total_profissionais: number
  profissionais_pendentes: number
  profissionais_ativos: number
  total_solicitacoes: number
  solicitacoes_abertas: number
  solicitacoes_finalizadas: number
  total_reembolsos: number
  reembolsos_pendentes: number
  reembolsos_aprovados: number
  reembolsos_negados: number
}

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<any>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const adminData = localStorage.getItem('admin')
    if (adminData) {
      const adminUser = JSON.parse(adminData)
      setAdmin(adminUser)
      fetchStats()
    }
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
      }
      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-96 mb-2" />
            <Skeleton className="h-6 w-64" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-12 w-20 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Bem-vindo, {admin?.nome}</p>
        </div>

        {/* Estatísticas de Profissionais */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profissionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users size={16} />
                  Total de Profissionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats?.total_profissionais || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock size={16} />
                  Aguardando Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats?.profissionais_pendentes || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <UserCheck size={16} />
                  Profissionais Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats?.profissionais_ativos || 0}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Estatísticas de Solicitações */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Solicitações de Serviços</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <FileText size={16} />
                  Total de Solicitações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats?.total_solicitacoes || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock size={16} />
                  Abertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats?.solicitacoes_abertas || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Finalizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats?.solicitacoes_finalizadas || 0}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Estatísticas de Reembolsos */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Reembolsos</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-gray-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign size={16} />
                  Total de Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-600">{stats?.total_reembolsos || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock size={16} />
                  Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats?.reembolsos_pendentes || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Aprovados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats?.reembolsos_aprovados || 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <XCircle size={16} />
                  Negados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats?.reembolsos_negados || 0}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
