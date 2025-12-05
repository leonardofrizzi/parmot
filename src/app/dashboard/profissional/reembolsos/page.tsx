"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, Calendar, FileText, Link as LinkIcon, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"

interface SolicitacaoReembolso {
  id: string
  solicitacao_titulo: string
  cliente_nome: string
  motivo: string
  provas_urls: string[]
  moedas_gastas: number
  tipo_contato: string
  status: string
  resposta_admin: string | null
  created_at: string
  analisado_em: string | null
}

interface Profissional {
  id: string
}

export default function ReembolsosProfissional() {
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoReembolso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setProfissional(user)
      fetchSolicitacoes(user.id)
    }
  }, [])

  const fetchSolicitacoes = async (profissional_id: string) => {
    try {
      const response = await fetch(`/api/profissional/reembolso/listar?profissional_id=${profissional_id}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao carregar solicitações")
        setLoading(false)
        return
      }

      setSolicitacoes(data.reembolsos || [])
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number }> }> = {
      pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: Clock },
      aprovado: { label: "Aprovado", color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle2 },
      negado: { label: "Negado", color: "bg-red-100 text-red-700 border-red-300", icon: XCircle },
    }

    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700", icon: AlertCircle }
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon size={14} />
        {config.label}
      </Badge>
    )
  }

  const getStats = () => {
    if (!solicitacoes || solicitacoes.length === 0) {
      return { pendentes: 0, aprovados: 0, negados: 0, totalMoedasAprovadas: 0 }
    }

    const pendentes = solicitacoes.filter(s => s.status === 'pendente').length
    const aprovados = solicitacoes.filter(s => s.status === 'aprovado').length
    const negados = solicitacoes.filter(s => s.status === 'negado').length
    const totalMoedasAprovadas = solicitacoes
      .filter(s => s.status === 'aprovado')
      .reduce((sum, s) => sum + s.moedas_gastas, 0)

    return { pendentes, aprovados, negados, totalMoedasAprovadas }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-9 w-80 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-64 mb-2" />
                  <Skeleton className="h-4 w-48" />
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

  const stats = getStats()

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitações de Reembolso</h1>
          <p className="text-gray-600">
            Acompanhe o status das suas solicitações de reembolso
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{solicitacoes?.length || 0}</div>
              <p className="text-xs text-gray-600">Total de solicitações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
              <p className="text-xs text-gray-600">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
              <p className="text-xs text-gray-600">Aprovados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.totalMoedasAprovadas}</div>
              <p className="text-xs text-gray-600">Moedas recuperadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Solicitações */}
        {!solicitacoes || solicitacoes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mb-4 text-gray-400">
                <DollarSign size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma solicitação ainda
              </h3>
              <p className="text-gray-600">
                Você ainda não fez nenhuma solicitação de reembolso.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {solicitacoes.map((solicitacao) => (
              <Card key={solicitacao.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <CardTitle className="text-xl">{solicitacao.solicitacao_titulo}</CardTitle>
                        {getStatusBadge(solicitacao.status)}
                        {solicitacao.tipo_contato === 'exclusivo' && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                            Exclusivo
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Solicitado em {formatData(solicitacao.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} />
                          {solicitacao.moedas_gastas} moedas
                        </span>
                        <span>
                          Cliente: {solicitacao.cliente_nome}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Motivo */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-gray-500" />
                      <h4 className="font-semibold text-gray-900">Motivo:</h4>
                    </div>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                      {solicitacao.motivo}
                    </p>
                  </div>

                  {/* Provas */}
                  {solicitacao.provas_urls && solicitacao.provas_urls.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <LinkIcon size={16} className="text-gray-500" />
                        <h4 className="font-semibold text-gray-900">Provas anexadas:</h4>
                      </div>
                      <div className="space-y-2">
                        {solicitacao.provas_urls.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded text-sm">
                            <LinkIcon size={14} className="text-gray-400" />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex-1 truncate"
                            >
                              {url}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resposta do Admin (se houver) */}
                  {solicitacao.status !== 'pendente' && (
                    <div className={`p-4 rounded-lg border ${
                      solicitacao.status === 'aprovado'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {solicitacao.status === 'aprovado' ? (
                          <CheckCircle2 size={16} className="text-green-600" />
                        ) : (
                          <XCircle size={16} className="text-red-600" />
                        )}
                        <h4 className={`font-semibold ${
                          solicitacao.status === 'aprovado' ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {solicitacao.status === 'aprovado'
                            ? '✓ Reembolso Aprovado'
                            : '✗ Reembolso Negado'}
                        </h4>
                      </div>
                      {solicitacao.analisado_em && (
                        <p className="text-xs text-gray-600 mb-2">
                          Analisado em {formatData(solicitacao.analisado_em)}
                        </p>
                      )}
                      {solicitacao.resposta_admin && (
                        <p className={`text-sm ${
                          solicitacao.status === 'aprovado' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          <strong>Comentário do administrador:</strong> {solicitacao.resposta_admin}
                        </p>
                      )}
                      {solicitacao.status === 'aprovado' && (
                        <p className="text-sm text-green-800 mt-2">
                          💰 <strong>{solicitacao.moedas_gastas} moedas</strong> foram devolvidas ao seu saldo.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
