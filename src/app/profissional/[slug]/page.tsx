"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Star,
  MapPin,
  Calendar,
  ArrowLeft,
  User,
  MessageSquare,
  Loader2,
  GraduationCap,
  Building2,
  StarHalf,
  Award,
  Lock
} from "lucide-react"

interface Avaliacao {
  id: string
  nota: number
  comentario: string
  resposta_profissional: string | null
  created_at: string
  solicitacao_titulo?: string
  categoria_nome?: string
  clientes: {
    nome: string
  } | null
}

interface Profissional {
  id: string
  nome: string
  razao_social: string | null
  tipo: string
  cidade: string
  estado: string
  slug: string | null
  foto_url: string | null
  sobre: string | null
  created_at: string
  categorias: { id: string; nome: string }[]
}

interface Selo {
  id: string
  tipo: string
  data_fim: string
  media_avaliacoes: number
  total_avaliacoes: number
  tipo_selo_id: string | null
  tipo_selo: { nome: string; cor: string } | null
}

interface PerfilData {
  profissional: Profissional
  avaliacoes: Avaliacao[]
  estatisticas: {
    media: number
    total: number
  }
  selo: Selo | null
  selos: Selo[]
}

function getSeloGradient(cor: string): string {
  const map: Record<string, string> = {
    amber: 'from-amber-400 to-yellow-500',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-emerald-500',
    purple: 'from-purple-400 to-purple-600',
    red: 'from-red-400 to-red-600',
    pink: 'from-pink-400 to-pink-600',
  }
  return map[cor] || map.amber
}

function StarRating({ rating, size = 20 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={size} className="fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalf && <StarHalf size={size} className="fill-yellow-400 text-yellow-400" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-gray-300" />
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

export default function PerfilProfissional() {
  const params = useParams()
  const slug = params.slug as string
  const [data, setData] = useState<PerfilData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [needsLogin, setNeedsLogin] = useState(false)

  useEffect(() => {
    // Verificar se usuário está logado (cliente ou profissional)
    const usuarioData = localStorage.getItem('usuario')
    const tipoUsuario = localStorage.getItem('tipoUsuario')

    if (!usuarioData || !tipoUsuario) {
      setNeedsLogin(true)
      setLoading(false)
      return
    }

    const fetchPerfil = async () => {
      try {
        const response = await fetch(`/api/profissional/${slug}`)
        const result = await response.json()

        if (!response.ok) {
          setError(result.error || "Perfil não encontrado")
          return
        }

        setData(result)
      } catch (err) {
        setError("Erro ao carregar perfil")
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPerfil()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Tela de login necessário
  if (needsLogin) {
    // Criar URLs com redirect para voltar após login
    const currentPath = `/profissional/${slug}`
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`
    const cadastroUrl = `/cadastro/cliente?redirect=${encodeURIComponent(currentPath)}`

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h2>
            <p className="text-gray-600 mb-6">
              Para ver o perfil completo deste prestador de serviço, você precisa estar logado como cliente.
            </p>
            <div className="space-y-3">
              <Link href={loginUrl} className="block">
                <Button className="w-full">
                  Entrar como Cliente
                </Button>
              </Link>
              <Link href={cadastroUrl} className="block">
                <Button variant="outline" className="w-full">
                  Criar conta de Cliente
                </Button>
              </Link>
            </div>
            <div className="mt-6 pt-4 border-t">
              <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Voltar ao início
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || "Perfil não encontrado"}
            </h2>
            <p className="text-gray-600 mb-4">
              O perfil que você está procurando não existe ou não está disponível.
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao início
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profissional, avaliacoes = [], estatisticas = { media: 0, total: 0 }, selos = [] } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Card do Profissional */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar/Foto */}
              <div className="flex-shrink-0">
                {profissional.foto_url ? (
                  <Image
                    src={profissional.foto_url}
                    alt={profissional.nome}
                    width={120}
                    height={120}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-28 h-28 md:w-32 md:h-32 bg-primary-100 rounded-full flex items-center justify-center border-4 border-gray-200">
                    {profissional.tipo === "empresa" ? (
                      <Building2 className="w-14 h-14 text-primary-600" />
                    ) : (
                      <GraduationCap className="w-14 h-14 text-primary-600" />
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profissional.tipo === "empresa" ? profissional.razao_social : profissional.nome}
                    </h1>
                    {profissional.tipo === "empresa" && (
                      <p className="text-gray-600">Responsável: {profissional.nome}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selos.map((s) => {
                      const cor = s.tipo_selo?.cor || 'amber'
                      const nome = s.tipo_selo?.nome || s.tipo || 'Selo de Qualidade'
                      return (
                        <Badge key={s.id} className={`bg-gradient-to-r ${getSeloGradient(cor)} text-white border-0 gap-1`}>
                          <Award className="w-3.5 h-3.5" />
                          {nome}
                        </Badge>
                      )
                    })}
                    <Badge variant={profissional.tipo === "empresa" ? "secondary" : "outline"}>
                      {profissional.tipo === "empresa" ? "Empresa" : "Autônomo"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profissional.cidade}, {profissional.estado}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Desde {new Date(profissional.created_at).getFullYear()}</span>
                  </div>
                </div>

                {/* Avaliação Geral */}
                <div className="flex items-center gap-3 mt-4">
                  <StarRating rating={estatisticas.media} size={24} />
                  <span className="text-2xl font-bold text-gray-900">
                    {estatisticas.media.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({estatisticas.total} {estatisticas.total === 1 ? "avaliação" : "avaliações"})
                  </span>
                </div>

                {/* Categorias */}
                {profissional.categorias && profissional.categorias.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profissional.categorias.map((cat) => (
                      <Badge key={cat.id} variant="outline" className="bg-primary-50">
                        {cat.nome}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sobre */}
        {profissional.sobre && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sobre</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{profissional.sobre}</p>
            </CardContent>
          </Card>
        )}

        {/* Avaliações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Avaliações ({estatisticas.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {avaliacoes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>Este profissional ainda não recebeu avaliações.</p>
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
                        {avaliacao.solicitacao_titulo && (
                          <p className="text-xs text-primary-600 font-medium">
                            {avaliacao.solicitacao_titulo}
                            {avaliacao.categoria_nome && <span className="text-gray-400"> · {avaliacao.categoria_nome}</span>}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {formatDate(avaliacao.created_at)}
                        </p>
                      </div>
                      <StarRating rating={avaliacao.nota} size={16} />
                    </div>

                    {avaliacao.comentario && (
                      <p className="text-gray-700 mt-2">{avaliacao.comentario}</p>
                    )}

                    {avaliacao.resposta_profissional && (
                      <div className="mt-3 ml-4 p-3 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Resposta do profissional:
                        </p>
                        <p className="text-gray-600 text-sm">
                          {avaliacao.resposta_profissional}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-4">
            Precisa de um profissional como este?
          </p>
          <Link href="/cadastro/cliente">
            <Button size="lg">
              Solicitar Serviço
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
