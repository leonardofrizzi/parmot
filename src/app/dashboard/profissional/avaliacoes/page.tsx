"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Star,
  MessageSquare,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Users,
  Loader2,
  Reply
} from "lucide-react"

interface Avaliacao {
  id: string
  nota: number
  comentario: string | null
  resposta_profissional: string | null
  created_at: string
  clientes: {
    nome: string
  } | null
  solicitacoes: {
    titulo: string
  } | null
}

interface Profissional {
  id: string
  nome: string
  slug: string | null
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export default function AvaliacoesProfissional() {
  const router = useRouter()
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const [mediaGeral, setMediaGeral] = useState(0)
  const [showResponderDialog, setShowResponderDialog] = useState(false)
  const [avaliacaoParaResponder, setAvaliacaoParaResponder] = useState<Avaliacao | null>(null)
  const [resposta, setResposta] = useState("")
  const [enviandoResposta, setEnviandoResposta] = useState(false)

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setProfissional(user)
      fetchAvaliacoes(user.id)
    }
  }, [])

  const fetchAvaliacoes = async (profissionalId: string) => {
    try {
      const response = await fetch(`/api/avaliacoes?profissional_id=${profissionalId}`)
      if (response.ok) {
        const data = await response.json()
        setAvaliacoes(data)

        // Calcular média
        if (data.length > 0) {
          const soma = data.reduce((acc: number, av: Avaliacao) => acc + av.nota, 0)
          setMediaGeral(Math.round((soma / data.length) * 10) / 10)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar avaliações:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPerfilUrl = () => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    const identifier = profissional?.slug || profissional?.id
    return `${baseUrl}/profissional/${identifier}`
  }

  const copiarLink = () => {
    navigator.clipboard.writeText(getPerfilUrl())
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const abrirResponderDialog = (avaliacao: Avaliacao) => {
    setAvaliacaoParaResponder(avaliacao)
    setResposta(avaliacao.resposta_profissional || "")
    setShowResponderDialog(true)
  }

  const enviarResposta = async () => {
    if (!avaliacaoParaResponder || !profissional || !resposta.trim()) return

    setEnviandoResposta(true)

    try {
      const response = await fetch(`/api/avaliacoes/${avaliacaoParaResponder.id}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profissional_id: profissional.id,
          resposta: resposta.trim()
        })
      })

      if (response.ok) {
        // Atualizar lista local
        setAvaliacoes(avaliacoes.map(av =>
          av.id === avaliacaoParaResponder.id
            ? { ...av, resposta_profissional: resposta.trim() }
            : av
        ))
        setShowResponderDialog(false)
        setAvaliacaoParaResponder(null)
        setResposta("")
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao enviar resposta')
      }
    } catch (err) {
      console.error('Erro:', err)
      alert('Erro ao conectar com o servidor')
    } finally {
      setEnviandoResposta(false)
    }
  }

  // Distribuição de notas
  const getDistribuicao = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    avaliacoes.forEach(av => {
      dist[av.nota as keyof typeof dist]++
    })
    return dist
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const distribuicao = getDistribuicao()

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Avaliações</h1>
        <p className="text-gray-600 mb-8">Veja o que seus clientes estão dizendo sobre você</p>

        {/* Link do Perfil Público */}
        <Card className="mb-6 border-primary-200 bg-primary-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <LinkIcon className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Seu Perfil Público</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Compartilhe este link com seus clientes para que eles possam ver suas avaliações e entrar em contato.
            </p>
            <div className="flex gap-2">
              <Input
                value={getPerfilUrl()}
                readOnly
                className="bg-white"
              />
              <Button onClick={copiarLink} variant="outline" className="flex-shrink-0">
                {copiado ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => window.open(getPerfilUrl(), '_blank')}
                variant="outline"
                className="flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nota média</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mediaGeral > 0 ? mediaGeral.toFixed(1) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total de avaliações</p>
                  <p className="text-2xl font-bold text-gray-900">{avaliacoes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">5 estrelas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {avaliacoes.length > 0
                      ? Math.round((distribuicao[5] / avaliacoes.length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribuição de Notas */}
        {avaliacoes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Distribuição de Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((nota) => {
                  const count = distribuicao[nota as keyof typeof distribuicao]
                  const percent = avaliacoes.length > 0 ? (count / avaliacoes.length) * 100 : 0
                  return (
                    <div key={nota} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-medium">{nota}</span>
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Avaliações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Avaliações Recebidas
            </CardTitle>
            <CardDescription>
              {avaliacoes.length === 0
                ? "Você ainda não recebeu nenhuma avaliação"
                : `${avaliacoes.length} avaliação(ões)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {avaliacoes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium mb-2">Nenhuma avaliação ainda</p>
                <p className="text-sm">
                  Complete serviços e peça para seus clientes avaliarem você!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {avaliacoes.map((avaliacao) => (
                  <div key={avaliacao.id} className="border-b last:border-0 pb-6 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {avaliacao.clientes?.nome || "Cliente"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(avaliacao.created_at)}
                          {avaliacao.solicitacoes && (
                            <span className="ml-2 text-primary-600">
                              • {avaliacao.solicitacoes.titulo}
                            </span>
                          )}
                        </p>
                      </div>
                      <StarDisplay rating={avaliacao.nota} size={18} />
                    </div>

                    {avaliacao.comentario && (
                      <p className="text-gray-700 mt-2">{avaliacao.comentario}</p>
                    )}

                    {/* Resposta do profissional */}
                    {avaliacao.resposta_profissional ? (
                      <div className="mt-3 ml-4 p-3 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Sua resposta:
                        </p>
                        <p className="text-gray-600 text-sm">
                          {avaliacao.resposta_profissional}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-primary-600"
                          onClick={() => abrirResponderDialog(avaliacao)}
                        >
                          Editar resposta
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => abrirResponderDialog(avaliacao)}
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Responder
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para responder avaliação */}
        <Dialog open={showResponderDialog} onOpenChange={setShowResponderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Responder Avaliação</DialogTitle>
              <DialogDescription>
                Responda ao comentário de {avaliacaoParaResponder?.clientes?.nome || "cliente"}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {avaliacaoParaResponder?.comentario && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <StarDisplay rating={avaliacaoParaResponder.nota} size={14} />
                  </div>
                  <p className="text-sm text-gray-700 italic">
                    "{avaliacaoParaResponder.comentario}"
                  </p>
                </div>
              )}

              <Textarea
                placeholder="Escreva sua resposta..."
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right mt-1">
                {resposta.length}/500 caracteres
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowResponderDialog(false)}
                disabled={enviandoResposta}
              >
                Cancelar
              </Button>
              <Button
                onClick={enviarResposta}
                disabled={enviandoResposta || !resposta.trim()}
              >
                {enviandoResposta ? 'Enviando...' : 'Enviar Resposta'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
