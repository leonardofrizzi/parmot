"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ReembolsoModal } from "@/components/ReembolsoModal"
import { Calendar, MapPin, Search, Phone, Mail, User, Crown, Users, DollarSign, ExternalLink, Clock, CheckCircle2, XCircle, ThumbsDown, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import * as Icons from "lucide-react"

type FiltroStatus = "todos" | "aberta" | "em_andamento" | "finalizada" | "cancelada"

interface Atendimento {
  resposta_id: string
  solicitacao_id: string
  exclusivo: boolean
  data_liberacao: string
  titulo: string
  descricao: string
  status: string
  data_solicitacao: string
  categoria_nome: string
  categoria_icone: string
  subcategoria_nome: string
  cliente_nome: string
  cliente_email: string
  cliente_telefone: string
  cliente_cidade: string
  cliente_estado: string
  tem_reembolso?: boolean
  reembolso_status?: string
}

export default function AtendimentosProfissional() {
  const router = useRouter()
  const [profissional, setProfissional] = useState<any>(null)
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos")
  const [showReembolsoModal, setShowReembolsoModal] = useState(false)
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<Atendimento | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [loadingReembolso, setLoadingReembolso] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [reembolsoResult, setReembolsoResult] = useState<{ moedas: number; saldo: number } | null>(null)

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setProfissional(user)
      fetchAtendimentos(user.id)
    }
  }, [])

  const fetchAtendimentos = async (profissional_id: string) => {
    try {
      const response = await fetch(`/api/profissional/atendimentos?profissional_id=${profissional_id}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao carregar atendimentos")
        setLoading(false)
        return
      }

      setAtendimentos(data.atendimentos)
      setLoading(false)
    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  const renderIcone = (nomeIcone?: string) => {
    if (!nomeIcone) return null
    const IconComponent = Icons[nomeIcone as keyof typeof Icons] as any
    return IconComponent ? <IconComponent size={20} /> : null
  }

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleSolicitarReembolso = (atendimento: Atendimento) => {
    setAtendimentoSelecionado(atendimento)
    setShowReembolsoModal(true)
  }

  const handleReembolsoSolicitado = () => {
    alert('Solicitação de reembolso enviada com sucesso! Aguarde análise do administrador.')
    // Recarregar atendimentos para mostrar que já foi solicitado
    if (profissional) {
      fetchAtendimentos(profissional.id)
    }
  }

  const handleNaoFecheiNegocio = (atendimento: Atendimento) => {
    setAtendimentoSelecionado(atendimento)
    setShowConfirmDialog(true)
  }

  const confirmarReembolsoAutomatico = async () => {
    if (!atendimentoSelecionado || !profissional) return

    setLoadingReembolso(true)

    try {
      const response = await fetch('/api/profissional/reembolso/automatico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profissional_id: profissional.id,
          resposta_id: atendimentoSelecionado.resposta_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao processar reembolso')
        setLoadingReembolso(false)
        setShowConfirmDialog(false)
        return
      }

      // Atualizar localStorage com novo saldo
      const updatedUser = { ...profissional, saldo_moedas: data.novo_saldo }
      localStorage.setItem('usuario', JSON.stringify(updatedUser))
      setProfissional(updatedUser)

      // Disparar evento para atualizar o Sidebar
      window.dispatchEvent(new Event('saldoAtualizado'))

      // Mostrar resultado
      setReembolsoResult({
        moedas: data.moedas_reembolsadas,
        saldo: data.novo_saldo
      })

      setShowConfirmDialog(false)
      setShowSuccessDialog(true)

      // Recarregar atendimentos
      fetchAtendimentos(profissional.id)

    } catch (err) {
      console.error('Erro ao solicitar reembolso:', err)
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoadingReembolso(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      aberta: { label: "Em aberto", color: "bg-blue-100 text-blue-700" },
      em_andamento: { label: "Em andamento", color: "bg-yellow-100 text-yellow-700" },
      finalizada: { label: "Concluída", color: "bg-green-100 text-green-700" },
      cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700" },
    }

    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700" }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  // Filtrar atendimentos
  const atendimentosFiltrados = useMemo(() => {
    let resultado = [...atendimentos]

    // Aplicar filtro de status
    if (filtroStatus !== "todos") {
      resultado = resultado.filter((a) => a.status === filtroStatus)
    }

    // Aplicar filtro de pesquisa
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase()
      resultado = resultado.filter(
        (a) =>
          a.titulo.toLowerCase().includes(termo) ||
          a.descricao.toLowerCase().includes(termo) ||
          a.categoria_nome.toLowerCase().includes(termo) ||
          a.cliente_nome.toLowerCase().includes(termo)
      )
    }

    return resultado
  }, [atendimentos, searchTerm, filtroStatus])

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Atendimentos Skeleton */}
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Atendimentos</h1>
          <p className="text-gray-600">
            Contatos de clientes que você já liberou
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Filtros e Barra de Pesquisa */}
        {atendimentos.length > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filtro por Status */}
              <div className="w-full sm:w-64">
                <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value as FiltroStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="aberta">Em aberto</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="finalizada">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Barra de Pesquisa */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Pesquisar por título, categoria ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Contador de Resultados */}
            {(searchTerm || filtroStatus !== "todos") && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {atendimentosFiltrados.length} resultado(s) encontrado(s)
                </p>
              </div>
            )}

            {/* Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-gray-900">{atendimentos.length}</div>
                  <p className="text-xs text-gray-600">Total de atendimentos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {atendimentos.filter(a => a.status === 'aberta').length}
                  </div>
                  <p className="text-xs text-gray-600">Em aberto</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    {atendimentos.filter(a => a.status === 'em_andamento').length}
                  </div>
                  <p className="text-xs text-gray-600">Em andamento</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {atendimentos.filter(a => a.status === 'finalizada').length}
                  </div>
                  <p className="text-xs text-gray-600">Concluídas</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Lista de Atendimentos */}
        {atendimentos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-4 text-gray-400">
                <Search size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum atendimento ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Você ainda não liberou nenhum contato de cliente. Acesse "Buscar Serviços" para ver solicitações disponíveis.
              </p>
              <Button onClick={() => router.push('/dashboard/profissional/solicitacoes')}>
                Buscar Serviços
              </Button>
            </CardContent>
          </Card>
        ) : atendimentosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-4 text-gray-400">
                <Search size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Tente usar outros termos de pesquisa ou filtros.
              </p>
              <Button variant="outline" onClick={() => { setSearchTerm(""); setFiltroStatus("todos") }}>
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {atendimentosFiltrados.map((atendimento) => (
              <Card key={atendimento.resposta_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="text-primary-600">
                          {renderIcone(atendimento.categoria_icone)}
                        </div>
                        <CardTitle className="text-xl">{atendimento.titulo}</CardTitle>
                        {getStatusBadge(atendimento.status)}
                        {atendimento.exclusivo && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                            <Crown size={12} />
                            Exclusivo
                          </span>
                        )}
                      </div>
                      <CardDescription className="flex items-center flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Liberado em {formatData(atendimento.data_liberacao)}
                        </span>
                        <span>
                          {atendimento.categoria_nome} → {atendimento.subcategoria_nome}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{atendimento.descricao}</p>

                  {/* Informações de Contato do Cliente */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <User size={16} />
                      Contato do Cliente
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-green-600" />
                        <span className="text-gray-700">
                          <strong>Nome:</strong> {atendimento.cliente_nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-green-600" />
                        <span className="text-gray-700">
                          <strong>Telefone:</strong>{" "}
                          <a href={`tel:${atendimento.cliente_telefone}`} className="text-green-700 hover:underline">
                            {atendimento.cliente_telefone}
                          </a>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-green-600" />
                        <span className="text-gray-700">
                          <strong>Email:</strong>{" "}
                          <a href={`mailto:${atendimento.cliente_email}`} className="text-green-700 hover:underline">
                            {atendimento.cliente_email}
                          </a>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-green-600" />
                        <span className="text-gray-700">
                          <strong>Localização:</strong> {atendimento.cliente_cidade}, {atendimento.cliente_estado}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="text-sm text-gray-500">
                      Solicitado em {formatData(atendimento.data_solicitacao)}
                    </div>

                    {/* Botão Dinâmico de Reembolso */}
                    {atendimento.tem_reembolso ? (
                      // Já tem reembolso solicitado/aprovado
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push('/dashboard/profissional/reembolsos')}
                        className={
                          atendimento.reembolso_status === 'pendente'
                            ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                            : atendimento.reembolso_status === 'aprovado'
                            ? 'border-green-300 text-green-700 hover:bg-green-50'
                            : 'border-red-300 text-red-700 hover:bg-red-50'
                        }
                      >
                        {atendimento.reembolso_status === 'pendente' && <Clock size={16} className="mr-2" />}
                        {atendimento.reembolso_status === 'aprovado' && <CheckCircle2 size={16} className="mr-2" />}
                        {atendimento.reembolso_status === 'negado' && <XCircle size={16} className="mr-2" />}
                        {atendimento.reembolso_status === 'pendente' && 'Reembolso Pendente'}
                        {atendimento.reembolso_status === 'aprovado' && 'Garantia Utilizada'}
                        {atendimento.reembolso_status === 'negado' && 'Reembolso Negado'}
                        <ExternalLink size={14} className="ml-2" />
                      </Button>
                    ) : (
                      // Não tem reembolso - mostrar botão de garantia automática
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleNaoFecheiNegocio(atendimento)}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      >
                        <ThumbsDown size={16} className="mr-2" />
                        Não fechei negócio
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Reembolso (legado) */}
        {atendimentoSelecionado && profissional && (
          <ReembolsoModal
            open={showReembolsoModal}
            onOpenChange={setShowReembolsoModal}
            atendimento={atendimentoSelecionado}
            profissionalId={profissional.id}
            onReembolsoSolicitado={handleReembolsoSolicitado}
          />
        )}

        {/* Dialog de Confirmação - Não fechei negócio */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ThumbsDown className="text-orange-500" size={24} />
                Confirmar: Não fechei negócio
              </DialogTitle>
              <DialogDescription>
                Você está confirmando que não fechou negócio com <strong>{atendimentoSelecionado?.cliente_nome}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Garantia de 30%
                </h4>
                <p className="text-sm text-green-800">
                  Você receberá automaticamente <strong>30% das moedas</strong> gastas neste contato de volta em seu saldo.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Esta ação não pode ser desfeita. Após confirmar, você não poderá solicitar outro tipo de reembolso para este atendimento.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={loadingReembolso}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarReembolsoAutomatico}
                disabled={loadingReembolso}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loadingReembolso ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar e receber 30%'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Sucesso */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-green-600" size={40} />
                </div>
                <div>
                  <DialogTitle className="text-2xl mb-2">
                    Moedas Creditadas!
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Sua garantia de 30% foi aplicada com sucesso.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {reembolsoResult && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Moedas devolvidas:</span>
                  <span className="font-semibold text-green-600">+{reembolsoResult.moedas} moedas</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Novo saldo:</span>
                  <span className="font-bold text-primary-600 text-lg">{reembolsoResult.saldo} moedas</span>
                </div>
              </div>
            )}

            <DialogFooter className="sm:justify-center">
              <Button onClick={() => setShowSuccessDialog(false)} className="bg-green-600 hover:bg-green-700">
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
