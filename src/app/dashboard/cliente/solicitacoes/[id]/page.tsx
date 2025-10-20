"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Solicitacao } from "@/types/database"
import { ArrowLeft, Calendar, MapPin, MessageSquare, User } from "lucide-react"
import * as Icons from "lucide-react"

interface Resposta {
  id: string
  profissional_id: string
  mensagem: string
  contato_liberado: boolean
  created_at: string
  profissional_nome?: string
  profissional_telefone?: string
  profissional_email?: string
}

export default function DetalheSolicitacao() {
  const router = useRouter()
  const params = useParams()
  const solicitacaoId = params.id as string

  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchDetalhes()
  }, [solicitacaoId])

  const fetchDetalhes = async () => {
    try {
      const response = await fetch(`/api/solicitacoes/${solicitacaoId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao carregar detalhes")
        setLoading(false)
        return
      }

      setSolicitacao(data.solicitacao)
      setRespostas(data.respostas || [])
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

  const renderIcone = (nomeIcone?: string) => {
    if (!nomeIcone) return null
    const IconComponent = Icons[nomeIcone as keyof typeof Icons] as any
    return IconComponent ? <IconComponent size={24} /> : null
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Carregando detalhes...</p>
      </div>
    )
  }

  if (error || !solicitacao) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => router.back()} className="mb-6">
            <ArrowLeft size={16} className="mr-2" /> Voltar
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-red-600">{error || "Solicitação não encontrada"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>

        {/* Detalhes da Solicitação */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-primary-600">
                  {renderIcone(solicitacao.categoria_icone)}
                </div>
                <div>
                  <CardTitle className="text-2xl mb-2">{solicitacao.titulo}</CardTitle>
                  <CardDescription className="flex items-center flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatData(solicitacao.created_at)}
                    </span>
                    <span>
                      {solicitacao.categoria_nome} → {solicitacao.subcategoria_nome}
                    </span>
                    {solicitacao.cliente_cidade && solicitacao.cliente_estado && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {solicitacao.cliente_cidade}, {solicitacao.cliente_estado}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(solicitacao.status)}`}>
                {getStatusLabel(solicitacao.status)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição do serviço</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{solicitacao.descricao}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profissionais Interessados */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User size={20} />
              <CardTitle>Profissionais Interessados ({respostas.length})</CardTitle>
            </div>
            <CardDescription>
              Profissionais que liberaram contato para realizar este serviço
            </CardDescription>
          </CardHeader>
          <CardContent>
            {respostas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Nenhum profissional interessado ainda.</p>
                <p className="text-sm mt-1">Aguarde profissionais visualizarem sua solicitação.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {respostas.map((resposta) => (
                  <Card key={resposta.id} className="border-l-4 border-l-primary-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                            <User size={24} className="text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">
                              {resposta.profissional_nome || "Profissional"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Liberou contato em {formatData(resposta.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                        <p className="text-sm font-semibold text-gray-900 mb-3">Entre em contato:</p>
                        <div className="space-y-2">
                          {resposta.profissional_telefone && (
                            <a
                              href={`https://wa.me/55${resposta.profissional_telefone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 transition-colors"
                            >
                              <MessageSquare size={16} />
                              <span><strong>WhatsApp:</strong> {resposta.profissional_telefone}</span>
                            </a>
                          )}
                          {resposta.profissional_email && (
                            <a
                              href={`mailto:${resposta.profissional_email}`}
                              className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600 transition-colors"
                            >
                              <span>📧</span>
                              <span><strong>Email:</strong> {resposta.profissional_email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
