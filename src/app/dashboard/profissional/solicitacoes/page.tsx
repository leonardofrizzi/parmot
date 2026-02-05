"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Solicitacao } from "@/types/database"
import { Calendar, MapPin, Search, Lock, Users, Coins } from "lucide-react"
import { IconRenderer } from "@/components/IconRenderer"
import { EmptyState } from "@/components/EmptyState"
import DistanciaIndicador from "@/components/DistanciaIndicador"

type FiltroStatus = "todos" | "com_vagas"
type FiltroModalidade = "todos" | "minha_cidade" | "online"

interface Profissional {
  id: string
  cep?: string
  estado: string
  cidade: string
  atende_online?: boolean
  aprovado?: boolean
}

interface SolicitacaoComStatus extends Solicitacao {
  ja_liberou?: boolean
  vagas_disponiveis?: number
  cliente_cep?: string
  cliente_cidade?: string
  cliente_estado?: string
  resposta_id?: string
  exclusivo?: boolean
}

interface Configuracoes {
  custo_contato_normal: number
  custo_contato_exclusivo: number
}

export default function SolicitacoesProfissional() {
  const router = useRouter()
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos")
  const [filtroModalidade, setFiltroModalidade] = useState<FiltroModalidade>("todos")
  const [config, setConfig] = useState<Configuracoes>({
    custo_contato_normal: 15,
    custo_contato_exclusivo: 50
  })

  useEffect(() => {
    // Buscar configurações de moedas
    fetch('/api/configuracoes')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Erro ao buscar configurações:', err))

    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setProfissional(user)
      fetchSolicitacoes(user.estado, user.cidade)
    }
  }, [])

  const fetchSolicitacoes = async (estado: string, cidade: string) => {
    try {
      const usuarioData = localStorage.getItem('usuario')
      if (!usuarioData) return

      const user = JSON.parse(usuarioData)

      // Buscar TODAS as solicitações (atende_online=true para trazer de todo o Brasil)
      // O filtro de localização será feito no frontend
      const response = await fetch(
        `/api/profissional/solicitacoes?estado=${estado}&cidade=${cidade}&profissional_id=${user.id}&atende_online=true`
      )
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao carregar solicitações")
        setLoading(false)
        return
      }

      setSolicitacoes(data.solicitacoes as SolicitacaoComStatus[])
      setLoading(false)
    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Filtrar solicitações com base na pesquisa, status e modalidade
  const solicitacoesFiltradas = useMemo(() => {
    let resultado = [...solicitacoes]

    // Aplicar filtro de modalidade (localização)
    if (filtroModalidade === "minha_cidade" && profissional) {
      resultado = resultado.filter(
        (s) => s.cliente_cidade === profissional.cidade && s.cliente_estado === profissional.estado
      )
    } else if (filtroModalidade === "online" && profissional) {
      resultado = resultado.filter(
        (s) => s.cliente_cidade !== profissional.cidade || s.cliente_estado !== profissional.estado
      )
    }

    // SEMPRE filtrar apenas as NÃO liberadas (as liberadas ficam em "Meus Atendimentos")
    resultado = resultado.filter((s) => !s.ja_liberou)

    // Aplicar filtro adicional de status
    if (filtroStatus === "com_vagas") {
      resultado = resultado.filter((s) => (s.vagas_disponiveis || 0) > 0)
    }

    // Aplicar filtro de pesquisa
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase()
      resultado = resultado.filter(
        (s) =>
          s.titulo.toLowerCase().includes(termo) ||
          s.descricao.toLowerCase().includes(termo) ||
          s.categoria_nome?.toLowerCase().includes(termo) ||
          s.subcategoria_nome?.toLowerCase().includes(termo)
      )
    }

    return resultado
  }, [solicitacoes, searchTerm, filtroStatus, filtroModalidade, profissional])

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>

          {/* Filters Skeleton */}
          <div className="mb-6 flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 flex-1" />
          </div>

          {/* Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-6 w-64" />
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-9 w-28" />
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Solicitações Disponíveis</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {profissional?.cidade && profissional?.estado
              ? `Clientes procurando profissionais em ${profissional.cidade}, ${profissional.estado}`
              : 'Clientes procurando profissionais na sua região'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Filtros e Barra de Pesquisa */}
        {solicitacoes.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filtro por Modalidade (Localização) */}
              <div className="w-full sm:w-48">
                <Select value={filtroModalidade} onValueChange={(value) => setFiltroModalidade(value as FiltroModalidade)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Localização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as regiões</SelectItem>
                    <SelectItem value="minha_cidade">Minha cidade</SelectItem>
                    <SelectItem value="online">Outras cidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Status */}
              <div className="w-full sm:w-56">
                <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as FiltroStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as solicitações</SelectItem>
                    <SelectItem value="com_vagas">Com vagas disponíveis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Barra de Pesquisa */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Pesquisar por título, descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Contador de Resultados */}
            {(searchTerm || filtroStatus !== "todos" || filtroModalidade !== "todos") && (
              <p className="text-sm text-gray-600">
                {solicitacoesFiltradas.length} resultado(s) encontrado(s)
              </p>
            )}
          </div>
        )}

        {/* Lista de Solicitações */}
        {solicitacoes.length === 0 ? (
          <EmptyState
            icon={<Search size={64} />}
            title="Nenhuma solicitação disponível"
            description="Não há solicitações de clientes na sua região no momento."
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
          <div className="space-y-3 sm:space-y-4">
            {solicitacoesFiltradas.map((solicitacao) => (
              <Card key={solicitacao.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-primary-600 flex-shrink-0">
                          <IconRenderer name={solicitacao.categoria_icone} />
                        </div>
                        <CardTitle className="text-lg sm:text-xl">{solicitacao.titulo}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatData(solicitacao.created_at)}
                      </span>
                      <span className="hidden sm:inline">
                        {solicitacao.categoria_nome} → {solicitacao.subcategoria_nome}
                      </span>
                      {solicitacao.cliente_cidade && solicitacao.cliente_estado && (
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {solicitacao.cliente_cidade}, {solicitacao.cliente_estado}
                        </span>
                      )}
                      {profissional && (solicitacao.cliente_cep || (solicitacao.cliente_cidade && solicitacao.cliente_estado)) && (
                        <DistanciaIndicador
                          cepOrigem={profissional.cep}
                          cidadeOrigem={profissional.cidade}
                          estadoOrigem={profissional.estado}
                          cepDestino={solicitacao.cliente_cep}
                          cidadeDestino={solicitacao.cliente_cidade || ''}
                          estadoDestino={solicitacao.cliente_estado || ''}
                        />
                      )}
                      <span className="flex items-center gap-1 text-orange-600">
                        <Users size={14} />
                        {solicitacao.vagas_disponiveis || 0} vaga(s) disponível(eis)
                      </span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <p className="text-sm sm:text-base text-gray-700 mb-4 line-clamp-2 sm:line-clamp-none">{solicitacao.descricao}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span className="flex items-center gap-1">
                          <Lock size={14} />
                          Liberar contato:
                        </span>
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium w-fit">
                            <Coins size={12} />
                            {config.custo_contato_normal} moedas
                          </span>
                          <span className="text-gray-400 hidden sm:inline">ou</span>
                          <span className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-full text-xs font-medium w-fit">
                            <Coins size={12} />
                            {config.custo_contato_exclusivo} exclusivo
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/dashboard/profissional/solicitacoes/${solicitacao.id}`)}
                      disabled={profissional && !profissional.aprovado}
                      title={profissional && !profissional.aprovado ? "Aguardando aprovação da sua conta" : ""}
                      className="w-full sm:w-auto"
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
