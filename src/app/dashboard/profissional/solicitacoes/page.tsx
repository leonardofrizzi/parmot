"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Solicitacao } from "@/types/database"
import { Calendar, MapPin, Search, Lock, CheckCircle2, Users, Coins, MessageCircle, Mail, DollarSign, AlertCircle, Handshake } from "lucide-react"
import { IconRenderer } from "@/components/IconRenderer"
import DistanciaIndicador from "@/components/DistanciaIndicador"

type FiltroStatus = "todos" | "nao_liberados" | "liberados" | "com_vagas"
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

  // Modal de reembolso
  const [showReembolsoModal, setShowReembolsoModal] = useState(false)
  const [reembolsoSolicitacao, setReembolsoSolicitacao] = useState<SolicitacaoComStatus | null>(null)
  const [reembolsoMotivo, setReembolsoMotivo] = useState("")
  const [reembolsoLoading, setReembolsoLoading] = useState(false)
  const [reembolsoError, setReembolsoError] = useState("")
  const [reembolsoSuccess, setReembolsoSuccess] = useState(false)

  // Modal fechei negócio
  const [showFecheiNegocioModal, setShowFecheiNegocioModal] = useState(false)
  const [fecheiNegocioSolicitacao, setFecheiNegocioSolicitacao] = useState<SolicitacaoComStatus | null>(null)
  const [fecheiNegocioLoading, setFecheiNegocioLoading] = useState(false)
  const [fecheiNegocioSuccess, setFecheiNegocioSuccess] = useState(false)
  
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

    // Aplicar filtro de status
    if (filtroStatus === "nao_liberados") {
      resultado = resultado.filter((s) => !s.ja_liberou)
    } else if (filtroStatus === "liberados") {
      resultado = resultado.filter((s) => s.ja_liberou)
    } else if (filtroStatus === "com_vagas") {
      resultado = resultado.filter((s) => !s.ja_liberou && (s.vagas_disponiveis || 0) > 0)
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

  const abrirModalReembolso = (solicitacao: SolicitacaoComStatus) => {
    setReembolsoSolicitacao(solicitacao)
    setReembolsoMotivo("")
    setReembolsoError("")
    setReembolsoSuccess(false)
    setShowReembolsoModal(true)
  }

  const handleSolicitarReembolso = async () => {
    if (!profissional || !reembolsoSolicitacao?.resposta_id) return

    if (reembolsoMotivo.trim().length < 20) {
      setReembolsoError("O motivo deve ter no mínimo 20 caracteres")
      return
    }

    setReembolsoLoading(true)
    setReembolsoError("")

    try {
      const response = await fetch('/api/profissional/reembolso/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profissional_id: profissional.id,
          resposta_id: reembolsoSolicitacao.resposta_id,
          motivo: reembolsoMotivo.trim(),
          provas_urls: []
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setReembolsoError(data.error || "Erro ao solicitar reembolso")
        setReembolsoLoading(false)
        return
      }

      setReembolsoSuccess(true)
      setReembolsoLoading(false)
    } catch (err) {
      setReembolsoError("Erro ao conectar com o servidor")
      setReembolsoLoading(false)
    }
  }

  const fecharModalReembolso = () => {
    setShowReembolsoModal(false)
    setReembolsoSolicitacao(null)
    setReembolsoMotivo("")
    setReembolsoError("")
    setReembolsoSuccess(false)
  }

  const abrirModalFecheiNegocio = (solicitacao: SolicitacaoComStatus) => {
    setFecheiNegocioSolicitacao(solicitacao)
    setFecheiNegocioSuccess(false)
    setShowFecheiNegocioModal(true)
  }

  const handleFecheiNegocio = async () => {
    if (!profissional || !fecheiNegocioSolicitacao) return

    setFecheiNegocioLoading(true)

    try {
      const response = await fetch('/api/profissional/fechar-negocio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profissional_id: profissional.id,
          solicitacao_id: fecheiNegocioSolicitacao.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao fechar negócio")
        setFecheiNegocioLoading(false)
        return
      }

      setFecheiNegocioSuccess(true)
      setFecheiNegocioLoading(false)

      // Recarregar solicitações
      fetchSolicitacoes(profissional.estado, profissional.cidade)
    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setFecheiNegocioLoading(false)
    }
  }

  const fecharModalFecheiNegocio = () => {
    setShowFecheiNegocioModal(false)
    setFecheiNegocioSolicitacao(null)
    setFecheiNegocioSuccess(false)
  }

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
                    <SelectItem value="nao_liberados">Ainda não liberadas</SelectItem>
                    <SelectItem value="liberados">Já liberadas por mim</SelectItem>
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
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-4 text-gray-400">
                <Search size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma solicitação disponível
              </h3>
              <p className="text-gray-600 mb-6">
                Não há solicitações de clientes na sua região no momento.
              </p>
            </CardContent>
          </Card>
        ) : solicitacoesFiltradas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-4 text-gray-400">
                <Search size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Tente usar outros termos de pesquisa.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Limpar pesquisa
              </Button>
            </CardContent>
          </Card>
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
                      {solicitacao.ja_liberou && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium w-fit">
                          <CheckCircle2 size={12} />
                          Liberado
                        </span>
                      )}
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
                      {!solicitacao.ja_liberou && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <Users size={14} />
                          {solicitacao.vagas_disponiveis || 0} vaga(s) disponível(eis)
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <p className="text-sm sm:text-base text-gray-700 mb-4 line-clamp-2 sm:line-clamp-none">{solicitacao.descricao}</p>

                  {/* Dados do cliente quando já liberou */}
                  {solicitacao.ja_liberou && (
                    <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Contato Liberado
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              abrirModalFecheiNegocio(solicitacao)
                            }}
                            className="text-green-600 border-green-300 hover:bg-green-50 text-xs h-7 px-2"
                          >
                            <Handshake size={12} className="mr-1" />
                            Fechei Negócio
                          </Button>
                          {solicitacao.resposta_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                abrirModalReembolso(solicitacao)
                              }}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50 text-xs h-7 px-2"
                            >
                              <DollarSign size={12} className="mr-1" />
                              Solicitar Reembolso
                            </Button>
                          )}
                        </div>
                      </div>
                      {(solicitacao as any).cliente_nome ? (
                        <>
                          <p className="font-semibold text-gray-900 mb-3">{(solicitacao as any).cliente_nome}</p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            {(solicitacao as any).cliente_telefone && (
                              <a
                                href={`https://wa.me/55${(solicitacao as any).cliente_telefone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MessageCircle size={16} />
                                WhatsApp
                              </a>
                            )}
                            {(solicitacao as any).cliente_email && (
                              <a
                                href={`mailto:${(solicitacao as any).cliente_email}`}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Mail size={16} />
                                Email
                              </a>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                          Carregando dados do cliente...
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      {solicitacao.ja_liberou ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 size={14} />
                          Você já tem acesso ao contato do cliente
                        </span>
                      ) : (
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
                      )}
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

      {/* Modal de Reembolso */}
      <Dialog open={showReembolsoModal} onOpenChange={fecharModalReembolso}>
        <DialogContent className="sm:max-w-[425px]">
          {!reembolsoSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <DollarSign className="text-orange-500" size={20} />
                  Solicitar Reembolso
                </DialogTitle>
                <DialogDescription>
                  Descreva o motivo pelo qual você está solicitando o reembolso das moedas gastas neste contato.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {reembolsoSolicitacao && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium text-gray-900">{reembolsoSolicitacao.titulo}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Cliente: {(reembolsoSolicitacao as any).cliente_nome || 'N/A'}
                    </p>
                    <p className="text-orange-600 text-xs mt-1">
                      Moedas gastas: {reembolsoSolicitacao.exclusivo ? config.custo_contato_exclusivo : config.custo_contato_normal}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo do reembolso *</Label>
                  <Textarea
                    id="motivo"
                    placeholder="Descreva detalhadamente o motivo (mínimo 20 caracteres)..."
                    value={reembolsoMotivo}
                    onChange={(e) => setReembolsoMotivo(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 text-right">{reembolsoMotivo.length}/500</p>
                </div>

                {reembolsoError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    {reembolsoError}
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={fecharModalReembolso} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSolicitarReembolso}
                  disabled={reembolsoLoading || reembolsoMotivo.trim().length < 20}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600"
                >
                  {reembolsoLoading ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <DialogTitle className="text-center">Solicitação Enviada!</DialogTitle>
                <DialogDescription className="text-center">
                  Sua solicitação de reembolso foi enviada com sucesso e será analisada pelo administrador.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={fecharModalReembolso} className="w-full">
                  Entendi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Fechei Negócio */}
      <Dialog open={showFecheiNegocioModal} onOpenChange={fecharModalFecheiNegocio}>
        <DialogContent className="sm:max-w-[425px]">
          {!fecheiNegocioSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Handshake className="text-green-500" size={20} />
                  Fechei Negócio
                </DialogTitle>
                <DialogDescription>
                  Ao confirmar, esta solicitação será marcada como concluída e não ficará mais disponível para outros profissionais.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                {fecheiNegocioSolicitacao && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-medium text-gray-900">{fecheiNegocioSolicitacao.titulo}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Cliente: {(fecheiNegocioSolicitacao as any).cliente_nome || 'N/A'}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={fecharModalFecheiNegocio} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button
                  onClick={handleFecheiNegocio}
                  disabled={fecheiNegocioLoading}
                  className="w-full sm:w-auto bg-green-500 hover:bg-green-600"
                >
                  {fecheiNegocioLoading ? "Confirmando..." : "Confirmar"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Handshake size={32} className="text-green-600" />
                </div>
                <DialogTitle className="text-center">Negócio Fechado!</DialogTitle>
                <DialogDescription className="text-center">
                  Parabéns! A solicitação foi marcada como concluída.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={fecharModalFecheiNegocio} className="w-full">
                  Entendi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
