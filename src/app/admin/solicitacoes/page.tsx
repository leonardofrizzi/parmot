"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, User, Calendar, MapPin, Tag } from "lucide-react"

interface Solicitacao {
  id: string
  titulo: string
  descricao: string
  status: string
  created_at: string
  cliente_nome: string
  cliente_email: string
  cliente_cidade: string
  cliente_estado: string
  categoria_nome: string
  subcategoria_nome: string
  total_respostas: number
}

export default function AdminSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | 'aberta' | 'finalizada'>('todas')

  useEffect(() => {
    fetchSolicitacoes()
  }, [filtro])

  const fetchSolicitacoes = async () => {
    try {
      const response = await fetch(`/api/admin/solicitacoes?filtro=${filtro}`)
      const data = await response.json()

      if (response.ok) {
        setSolicitacoes(data.solicitacoes)
      }
      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err)
      setLoading(false)
    }
  }

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      aberta: { label: 'Aberta', className: 'bg-blue-100 text-blue-700 border-blue-300' },
      em_andamento: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      finalizada: { label: 'Finalizada', className: 'bg-green-100 text-green-700 border-green-300' },
      cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-700 border-red-300' },
    }

    const { label, className } = config[status] || config.aberta

    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-9 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitações de Serviços</h1>
          <p className="text-gray-600">Visualizar todas as solicitações do sistema</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filtro === 'todas' ? 'default' : 'outline'}
            onClick={() => setFiltro('todas')}
          >
            Todas
          </Button>
          <Button
            variant={filtro === 'aberta' ? 'default' : 'outline'}
            onClick={() => setFiltro('aberta')}
          >
            Abertas
          </Button>
          <Button
            variant={filtro === 'finalizada' ? 'default' : 'outline'}
            onClick={() => setFiltro('finalizada')}
          >
            Finalizadas
          </Button>
        </div>

        {/* Lista de Solicitações */}
        {solicitacoes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-gray-600">
                Não há solicitações no sistema com este filtro.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {solicitacoes.map((sol) => (
              <Card key={sol.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{sol.titulo}</CardTitle>
                        {getStatusBadge(sol.status)}
                      </div>
                      <CardDescription className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatData(sol.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag size={14} />
                          {sol.categoria_nome} → {sol.subcategoria_nome}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">{sol.descricao}</p>

                  {/* Info do Cliente */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <User size={16} />
                      Cliente
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Nome:</span>{' '}
                        <span className="font-medium">{sol.cliente_nome}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>{' '}
                        <span className="font-medium">{sol.cliente_email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-gray-600">{sol.cliente_cidade}, {sol.cliente_estado}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {sol.total_respostas} resposta(s) de profissionais
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
