"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AvaliacaoModal } from "@/components/AvaliacaoModal"
import { StarRating } from "@/components/StarRating"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, MapPin, User, Phone, Mail, Crown, Star, MessageSquare, XCircle, CheckCircle, PlayCircle, Ban, ExternalLink, GraduationCap, Building2 } from "lucide-react"
import { IconRenderer } from "@/components/IconRenderer"

interface Cliente {
  id: string
}

interface Profissional {
  resposta_id: string
  profissional_id: string
  id?: string
  nome?: string
  profissional_nome?: string
  profissional?: {
    id?: string
    nome?: string
    telefone?: string
    email?: string
    foto_url?: string
    slug?: string
    tipo?: string
    razao_social?: string
  }
  email: string
  telefone: string
  media_avaliacoes: number | null
  total_avaliacoes: number
  exclusivo: boolean
  ja_avaliou?: boolean
}

interface Solicitacao {
  id: string
  titulo: string
  descricao: string
  status: string
  categoria_nome: string
  subcategoria_nome: string
  categoria_icone?: string
  created_at: string
  cliente_cidade?: string
  cliente_estado?: string
  profissionais_interessados: Profissional[]
  total_profissionais?: number
  tem_exclusivo?: boolean
  profissional_contratado_id?: string
}

interface Avaliacao {
  id: string
  nota: number
  comentario: string
  profissional_id: string
}

export default function DetalheSolicitacaoCliente() {
  const router = useRouter()
  const params = useParams()
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [showAvaliacaoModal, setShowAvaliacaoModal] = useState(false)
  const [profissionalParaAvaliar, setProfissionalParaAvaliar] = useState<Profissional | null>(null)
  const [avaliacaoExistente, setAvaliacaoExistente] = useState<Avaliacao | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [statusParaAtualizar, setStatusParaAtualizar] = useState<string>("")
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [profissionalSelecionadoId, setProfissionalSelecionadoId] = useState<string>("")

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      setCliente(JSON.parse(usuarioData))
    }

    if (params.id) {
      fetchSolicitacao(params.id as string)
    }
  }, [params.id])

  useEffect(() => {
    if (solicitacao && solicitacao.status === 'finalizada') {
      verificarAvaliacao()
    }
  }, [solicitacao])

  const fetchSolicitacao = async (id: string) => {
    try {
      const response = await fetch(`/api/cliente/solicitacoes/${id}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao carregar solicitação")
        setLoading(false)
        return
      }

      setSolicitacao(data.solicitacao)
      setLoading(false)
    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  const verificarAvaliacao = async () => {
    if (!solicitacao) return

    try {
      const response = await fetch(`/api/avaliacoes/solicitacao?solicitacao_id=${solicitacao.id}`)
      if (response.ok) {
        const data = await response.json()
        setAvaliacaoExistente(data.avaliacao)
      }
    } catch (err) {
      console.error('Erro ao verificar avaliação:', err)
    }
  }

  const handleAvaliar = (profissional: Profissional) => {
    setProfissionalParaAvaliar(profissional)
    setShowAvaliacaoModal(true)
  }

  const handleAvaliacaoEnviada = () => {
    verificarAvaliacao()
    fetchSolicitacao(params.id as string)
  }

  const handleAbrirDialogStatus = (novoStatus: string) => {
    setStatusParaAtualizar(novoStatus)
    setShowStatusDialog(true)
  }

  const handleAtualizarStatus = async () => {
    if (!cliente || !solicitacao) return

    setLoadingStatus(true)

    try {
      const body: any = {
        status: statusParaAtualizar,
        cliente_id: cliente.id
      }
      if (statusParaAtualizar === 'finalizada' && profissionalSelecionadoId) {
        body.profissional_contratado_id = profissionalSelecionadoId
      }

      const response = await fetch(`/api/cliente/solicitacoes/${solicitacao.id}/atualizar-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (!response.ok) {
        alert('Erro: ' + data.error)
        setLoadingStatus(false)
        return
      }

      // Atualizar solicitação local
      setSolicitacao({ ...solicitacao, status: statusParaAtualizar })
      setShowStatusDialog(false)
      setLoadingStatus(false)

      // Recarregar dados
      fetchSolicitacao(params.id as string)

    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      alert('Erro ao conectar com o servidor')
      setLoadingStatus(false)
    }
  }

  const getStatusInfo = (status: string) => {
    const statusConfig: Record<string, { label: string; descricao: string; icon: React.ComponentType<{ size?: number }> }> = {
      em_andamento: {
        label: 'Em Andamento',
        descricao: 'Marque como em andamento quando começar a trabalhar com o profissional.',
        icon: PlayCircle
      },
      finalizada: {
        label: 'Concluído',
        descricao: 'Marque como concluído quando o serviço for finalizado. Isso permitirá que você avalie o profissional.',
        icon: CheckCircle
      },
      cancelada: {
        label: 'Cancelado',
        descricao: 'Cancele esta solicitação se não precisar mais do serviço.',
        icon: Ban
      }
    }
    return statusConfig[status]
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
    const statusConfig: Record<string, { label: string; color: string }> = {
      aberta: { label: "Aberta", color: "bg-blue-100 text-blue-700" },
      em_andamento: { label: "Em andamento", color: "bg-yellow-100 text-yellow-700" },
      finalizada: { label: "Concluída", color: "bg-green-100 text-green-700" },
      cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700" },
    }

    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700" }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  if (error || !solicitacao) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <XCircle size={64} className="mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {error || "Solicitação não encontrada"}
              </h3>
              <Button onClick={() => router.push('/dashboard/cliente/solicitacoes')}>
                Voltar para lista
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => router.push('/dashboard/cliente/solicitacoes')} className="mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Voltar
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                    <IconRenderer name={solicitacao.categoria_icone} size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-1">{solicitacao.titulo}</CardTitle>
                    <CardDescription>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatData(solicitacao.created_at)}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(solicitacao.status)}
                  {solicitacao.tem_exclusivo && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                      <Crown size={14} />
                      Exclusivo
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-2">Descrição</h3>
            <p className="text-gray-700 mb-4">{solicitacao.descricao}</p>

            {/* Ações de Status - apenas para solicitações não finalizadas */}
            {solicitacao.status !== 'finalizada' && solicitacao.status !== 'cancelada' && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ações</h4>
                <div className="flex flex-wrap gap-2">
                  {(solicitacao.status === 'aberta' || solicitacao.status === 'em_andamento') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAbrirDialogStatus('finalizada')}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Marcar como Concluído
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAbrirDialogStatus('cancelada')}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Ban size={16} className="mr-2" />
                    Cancelar Solicitação
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profissional Contratado - quando finalizada */}
        {solicitacao.status === 'finalizada' && solicitacao.profissional_contratado_id && (() => {
          const contratado = solicitacao.profissionais_interessados.find(
            p => p.profissional?.id === solicitacao.profissional_contratado_id
          )
          if (!contratado) return null
          return (
            <Card className="mb-6 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle size={20} className="text-green-600" />
                  Profissional Contratado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Card className="border-2 border-green-100 bg-green-50/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {contratado.profissional?.foto_url ? (
                          <Image
                            src={contratado.profissional.foto_url}
                            alt={contratado.profissional?.nome || 'Profissional'}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover border-2 border-green-200"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center border-2 border-green-200">
                            {contratado.profissional?.tipo === 'empresa' ? (
                              <Building2 className="w-7 h-7 text-primary-600" />
                            ) : (
                              <GraduationCap className="w-7 h-7 text-primary-600" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {contratado.profissional?.tipo === 'empresa'
                                ? contratado.profissional?.razao_social || contratado.profissional?.nome
                                : contratado.profissional?.nome
                              }
                            </h4>
                            <span className="text-xs text-gray-500">
                              {contratado.profissional?.tipo === 'empresa' ? 'Empresa' : 'Autônomo'}
                            </span>
                          </div>
                          <Link
                            href={`/profissional/${contratado.profissional?.slug || contratado.profissional?.id}`}
                            target="_blank"
                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            Ver perfil
                            <ExternalLink size={14} />
                          </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={14} className="text-gray-400" />
                            <a href={`tel:${contratado.profissional?.telefone}`} className="text-primary-600 hover:underline">
                              {contratado.profissional?.telefone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail size={14} className="text-gray-400" />
                            <a href={`mailto:${contratado.profissional?.email}`} className="text-primary-600 hover:underline truncate">
                              {contratado.profissional?.email}
                            </a>
                          </div>
                        </div>

                        {/* Avaliar apenas o contratado */}
                        {!avaliacaoExistente && (
                          <div className="mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleAvaliar(contratado as Profissional)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                              <Star size={16} className="mr-2" />
                              Avaliar
                            </Button>
                          </div>
                        )}

                        {avaliacaoExistente && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Sua avaliação:</span>
                              <StarRating rating={avaliacaoExistente.nota} readonly size={18} />
                            </div>
                            {avaliacaoExistente.comentario && (
                              <p className="text-sm text-gray-600 italic">&quot;{avaliacaoExistente.comentario}&quot;</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )
        })()}

        {/* Profissionais Interessados */}
        <Card>
          <CardHeader>
            <CardTitle>Profissionais Interessados</CardTitle>
            <CardDescription>
              {solicitacao.total_profissionais === 0 ? 'Nenhum profissional interessado ainda' : `${solicitacao.total_profissionais} profissional(is)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {solicitacao.total_profissionais === 0 ? (
              <div className="text-center py-8">
                <User size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600">Aguardando profissionais interessados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {solicitacao.profissionais_interessados
                  .filter(item => item.profissional?.id !== solicitacao.profissional_contratado_id)
                  .map((item) => (
                  <Card key={item.resposta_id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {item.profissional?.foto_url ? (
                            <Image
                              src={item.profissional.foto_url}
                              alt={item.profissional?.nome || 'Profissional'}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                              {item.profissional?.tipo === 'empresa' ? (
                                <Building2 className="w-7 h-7 text-primary-600" />
                              ) : (
                                <GraduationCap className="w-7 h-7 text-primary-600" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {item.profissional?.tipo === 'empresa'
                                  ? item.profissional?.razao_social || item.profissional?.nome
                                  : item.profissional?.nome
                                }
                              </h4>
                              <div className="flex items-center gap-2">
                                {item.exclusivo && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                                    <Crown size={10} />
                                    Exclusivo
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {item.profissional?.tipo === 'empresa' ? 'Empresa' : 'Autônomo'}
                                </span>
                              </div>
                            </div>
                            <Link
                              href={`/profissional/${item.profissional?.slug || item.profissional?.id}`}
                              target="_blank"
                              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                              Ver perfil
                              <ExternalLink size={14} />
                            </Link>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone size={14} className="text-gray-400" />
                              <a href={`tel:${item.profissional?.telefone}`} className="text-primary-600 hover:underline">
                                {item.profissional?.telefone}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail size={14} className="text-gray-400" />
                              <a href={`mailto:${item.profissional?.email}`} className="text-primary-600 hover:underline truncate">
                                {item.profissional?.email}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Avaliação */}
        {profissionalParaAvaliar && (profissionalParaAvaliar.profissional?.id || profissionalParaAvaliar.profissional_id) && cliente && solicitacao && (
          <AvaliacaoModal
            open={showAvaliacaoModal}
            onOpenChange={setShowAvaliacaoModal}
            solicitacaoId={solicitacao.id}
            profissionalId={profissionalParaAvaliar.profissional?.id || profissionalParaAvaliar.profissional_id}
            profissionalNome={profissionalParaAvaliar.profissional?.nome || profissionalParaAvaliar.nome || 'Profissional'}
            clienteId={cliente.id}
            onAvaliacaoEnviada={handleAvaliacaoEnviada}
          />
        )}

        {/* Dialog de Confirmação de Status */}
        <Dialog open={showStatusDialog} onOpenChange={(open) => {
          setShowStatusDialog(open)
          if (!open) setProfissionalSelecionadoId('')
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {statusParaAtualizar && (() => {
                  const StatusIcon = getStatusInfo(statusParaAtualizar)?.icon
                  return StatusIcon ? <StatusIcon size={24} /> : null
                })()}
                {getStatusInfo(statusParaAtualizar)?.label}
              </DialogTitle>
              <DialogDescription>
                {getStatusInfo(statusParaAtualizar)?.descricao}
              </DialogDescription>
            </DialogHeader>

            {/* Selecionar profissional ao concluir */}
            {statusParaAtualizar === 'finalizada' && solicitacao.profissionais_interessados.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Qual profissional realizou o serviço?</p>
                <div className="space-y-2">
                  {solicitacao.profissionais_interessados
                    .filter((item, index, self) =>
                      index === self.findIndex(t => t.profissional?.id === item.profissional?.id)
                    )
                    .map((item) => (
                    <button
                      key={item.profissional?.id || item.resposta_id}
                      onClick={() => setProfissionalSelecionadoId(item.profissional?.id || '')}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                        profissionalSelecionadoId === item.profissional?.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        profissionalSelecionadoId === item.profissional?.id ? 'border-green-500 bg-green-50' : 'border-gray-300'
                      }`}>
                        {profissionalSelecionadoId === item.profissional?.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {item.profissional?.foto_url ? (
                          <Image
                            src={item.profissional.foto_url}
                            alt={item.profissional?.nome || ''}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <User size={14} className="text-primary-600" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-sm">
                        {item.profissional?.tipo === 'empresa'
                          ? item.profissional?.razao_social || item.profissional?.nome
                          : item.profissional?.nome
                        }
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                disabled={loadingStatus}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAtualizarStatus}
                disabled={loadingStatus || (statusParaAtualizar === 'finalizada' && !profissionalSelecionadoId && solicitacao.profissionais_interessados.length > 0)}
                className={
                  statusParaAtualizar === 'finalizada'
                    ? 'bg-green-600 hover:bg-green-700'
                    : statusParaAtualizar === 'cancelada'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }
              >
                {loadingStatus ? 'Atualizando...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
