"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, MessageSquare, Plus, Search, Users, Crown, Edit, Trash2 } from "lucide-react"
import { IconRenderer } from "@/components/IconRenderer"
import { EmptyState } from "@/components/EmptyState"

type FiltroStatus = "todos" | "aberta" | "em_andamento" | "finalizada" | "cancelada"

export default function MinhasSolicitacoes() {
  const router = useRouter()
  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos")

  useEffect(() => {
    fetchSolicitacoes()
  }, [])

  const fetchSolicitacoes = async () => {
    const usuarioData = localStorage.getItem('usuario')
    if (!usuarioData) {
      router.push('/login')
      return
    }

    const usuario = JSON.parse(usuarioData)

    try {
      const response = await fetch(`/api/solicitacoes?cliente_id=${usuario.id}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao carregar solicitações")
        setLoading(false)
        return
      }

      setSolicitacoes(data.solicitacoes)
      setLoading(false)
    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'aberta': 'Aguardando propostas',
      'em_andamento': 'Em andamento',
      'finalizada': 'Concluído',
      'cancelada': 'Cancelado'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'aberta': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'em_andamento': 'bg-blue-100 text-blue-800 border-blue-200',
      'finalizada': 'bg-green-100 text-green-800 border-green-200',
      'cancelada': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Filtrar solicitações com base na pesquisa
  const solicitacoesFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return solicitacoes

    const termo = searchTerm.toLowerCase()
    return solicitacoes.filter(
      (s) =>
        s.titulo.toLowerCase().includes(termo) ||
        s.descricao.toLowerCase().includes(termo) ||
        s.categoria_nome?.toLowerCase().includes(termo) ||
        s.subcategoria_nome?.toLowerCase().includes(termo)
    )
  }, [solicitacoes, searchTerm])

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>

          {/* Search Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-64" />
                      </div>
                      <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-8 w-28" />
                  </div>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Solicitações</h1>
            <p className="text-gray-600">Acompanhe suas solicitações de serviço</p>
          </div>
          <Button onClick={() => router.push('/dashboard/cliente/solicitar')}>
            <Plus size={16} className="mr-2" /> Nova Solicitação
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Barra de Pesquisa */}
        {solicitacoes.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Pesquisar por título, descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-2">
                {solicitacoesFiltradas.length} resultado(s) encontrado(s)
              </p>
            )}
          </div>
        )}

        {/* Lista de Solicitações */}
        {solicitacoes.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={64} />}
            title="Nenhuma solicitação ainda"
            description="Você ainda não fez nenhuma solicitação de serviço."
            action={{
              label: "Criar primeira solicitação",
              onClick: () => router.push('/dashboard/cliente/solicitar')
            }}
          />
        ) : solicitacoesFiltradas.length === 0 ? (
          <EmptyState
            icon={<Search size={64} />}
            title="Nenhum resultado encontrado"
            description="Tente usar outros termos de pesquisa."
            action={{
              label: "Limpar pesquisa",
              onClick: () => setSearchTerm("")
            }}
          />
        ) : (
          <div className="space-y-4">
            {solicitacoesFiltradas.map((solicitacao) => (
              <Card key={solicitacao.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-primary-600">
                          <IconRenderer name={solicitacao.categoria_icone} />
                        </div>
                        <CardTitle className="text-xl">{solicitacao.titulo}</CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatData(solicitacao.created_at)}
                        </span>
                        <span>
                          {solicitacao.categoria_nome} → {solicitacao.subcategoria_nome}
                        </span>
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(solicitacao.status)}`}>
                      {getStatusLabel(solicitacao.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{solicitacao.descricao}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={16} />
                      <span>{solicitacao.respostas_count || 0} profissional(is) interessado(s)</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/cliente/solicitacoes/${solicitacao.id}`)}
                    >
                      Ver detalhes
                    </Button>
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
