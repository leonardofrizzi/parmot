"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Solicitacao } from "@/types/database"
import { ArrowLeft, Calendar, MapPin, Coins, Lock, Unlock, Shield, Users, AlertCircle } from "lucide-react"
import * as Icons from "lucide-react"

interface Resposta {
  id: string
  profissional_id: string
  profissional_nome: string
  contato_liberado: boolean
  created_at: string
}

const CUSTO_CONTATO_NORMAL = 5 // moedas
const CUSTO_CONTATO_EXCLUSIVO = 20 // moedas
const MAX_PROFISSIONAIS = 4

export default function DetalheSolicitacaoProfissional() {
  const router = useRouter()
  const params = useParams()
  const solicitacaoId = params.id as string

  const [profissional, setProfissional] = useState<any>(null)
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [jaLiberou, setJaLiberou] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setProfissional(user)
      fetchDetalhes(user.id)
    }
  }, [solicitacaoId])

  const fetchDetalhes = async (profissionalId: string) => {
    try {
      const response = await fetch(`/api/profissional/solicitacoes/${solicitacaoId}?profissional_id=${profissionalId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao carregar detalhes")
        setLoading(false)
        return
      }

      setSolicitacao(data.solicitacao)
      setRespostas(data.respostas || [])
      setJaLiberou(data.ja_liberou || false)
      setLoading(false)
    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  const handleLiberar = async (exclusivo: boolean) => {
    const custo = exclusivo ? CUSTO_CONTATO_EXCLUSIVO : CUSTO_CONTATO_NORMAL

    if (profissional.saldo_moedas < custo) {
      setError(`Saldo insuficiente. Você precisa de ${custo} moedas.`)
      return
    }

    if (window.confirm(
      `Deseja liberar o contato ${exclusivo ? 'COM EXCLUSIVIDADE' : ''} por ${custo} moedas?\n\n` +
      (exclusivo ? 'Apenas você terá acesso ao contato do cliente!' : 'Até 4 profissionais podem liberar este contato.')
    )) {
      setError("")
      setSuccess("")
      setUnlocking(true)

      try {
        const response = await fetch('/api/profissional/liberar-contato', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profissional_id: profissional.id,
            solicitacao_id: solicitacaoId,
            exclusivo
          })
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Erro ao liberar contato")
          setUnlocking(false)
          return
        }

        // Atualizar saldo de moedas no localStorage
        const novoSaldo = profissional.saldo_moedas - custo
        const updatedUser = { ...profissional, saldo_moedas: novoSaldo }
        localStorage.setItem('usuario', JSON.stringify(updatedUser))
        setProfissional(updatedUser)

        setSuccess("Contato liberado com sucesso!")
        setUnlocking(false)

        // Recarregar página após 1.5s
        setTimeout(() => {
          window.location.reload()
        }, 1500)

      } catch (err) {
        setError("Erro ao conectar com o servidor")
        setUnlocking(false)
      }
    }
  }

  const renderIcone = (nomeIcone?: string) => {
    if (!nomeIcone) return null
    const IconComponent = Icons[nomeIcone as keyof typeof Icons] as any
    return IconComponent ? <IconComponent size={32} /> : null
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

  const vagasDisponiveis = MAX_PROFISSIONAIS - respostas.length
  const podeLiberar = vagasDisponiveis > 0 && !jaLiberou

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Carregando detalhes...</p>
      </div>
    )
  }

  if (error && !solicitacao) {
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

  if (!solicitacao) return null

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button variant="outline" onClick={() => router.back()} className="mb-6">
          <ArrowLeft size={16} className="mr-2" /> Voltar
        </Button>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
            {success}
          </div>
        )}

        {/* Detalhes da Solicitação */}
        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-blue-50">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-primary-600 shadow-sm">
                {renderIcone(solicitacao.categoria_icone)}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{solicitacao.titulo}</CardTitle>
                <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatData(solicitacao.created_at)}
                  </span>
                  <span className="px-2 py-1 bg-white rounded-full text-xs font-medium">
                    {solicitacao.categoria_nome}
                  </span>
                  {solicitacao.subcategoria_nome && (
                    <span className="px-2 py-1 bg-white rounded-full text-xs font-medium">
                      {solicitacao.subcategoria_nome}
                    </span>
                  )}
                  {solicitacao.cliente_cidade && solicitacao.cliente_estado && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs font-medium">
                      <MapPin size={14} />
                      {solicitacao.cliente_cidade}, {solicitacao.cliente_estado}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Descrição do serviço</h3>
              <p className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed">
                {solicitacao.descricao}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status de Vagas */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {vagasDisponiveis} {vagasDisponiveis === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {respostas.length} de {MAX_PROFISSIONAIS} profissionais já liberaram o contato
                  </p>
                </div>
              </div>
              {jaLiberou && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                  <Unlock size={14} />
                  Você já liberou
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações de Liberação */}
        {!jaLiberou && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Liberação Normal */}
            <Card className={`border-2 transition-all ${!podeLiberar ? 'opacity-50' : 'hover:border-primary-300 hover:shadow-md'}`}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-lg">Contato Padrão</CardTitle>
                  <div className="flex items-center gap-1 text-orange-600 font-bold text-xl">
                    <Coins size={20} />
                    {CUSTO_CONTATO_NORMAL}
                  </div>
                </div>
                <CardDescription>
                  Libere o contato do cliente e entre em contato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Acesso ao WhatsApp e email do cliente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>Até {MAX_PROFISSIONAIS} profissionais podem liberar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">⚠</span>
                    <span>Outros profissionais podem concorrer</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleLiberar(false)}
                  disabled={!podeLiberar || unlocking || profissional.saldo_moedas < CUSTO_CONTATO_NORMAL}
                  className="w-full"
                >
                  {unlocking ? "Liberando..." : `Liberar por ${CUSTO_CONTATO_NORMAL} moedas`}
                </Button>
                {profissional.saldo_moedas < CUSTO_CONTATO_NORMAL && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    Saldo insuficiente
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Liberação Exclusiva */}
            <Card className={`border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 transition-all ${!podeLiberar ? 'opacity-50' : 'hover:border-orange-300 hover:shadow-md'}`}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Exclusividade</CardTitle>
                    <Shield size={18} className="text-orange-600" />
                  </div>
                  <div className="flex items-center gap-1 text-orange-600 font-bold text-xl">
                    <Coins size={20} />
                    {CUSTO_CONTATO_EXCLUSIVO}
                  </div>
                </div>
                <CardDescription>
                  Seja o único profissional a ter acesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="font-medium">Acesso exclusivo ao contato</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="font-medium">Nenhum outro profissional poderá liberar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span className="font-medium">Cliente receberá apenas seu contato</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleLiberar(true)}
                  disabled={!podeLiberar || unlocking || profissional.saldo_moedas < CUSTO_CONTATO_EXCLUSIVO}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                >
                  {unlocking ? "Liberando..." : `Garantir Exclusividade por ${CUSTO_CONTATO_EXCLUSIVO} moedas`}
                </Button>
                {profissional.saldo_moedas < CUSTO_CONTATO_EXCLUSIVO && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    Saldo insuficiente
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!podeLiberar && !jaLiberou && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-800">
                <Lock size={20} />
                <p className="font-medium">
                  Esta solicitação já atingiu o limite de {MAX_PROFISSIONAIS} profissionais interessados.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações do seu saldo */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Coins size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Seu saldo atual</p>
                  <p className="text-2xl font-bold text-gray-900">{profissional.saldo_moedas} moedas</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/profissional/moedas')}
              >
                Comprar Moedas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
