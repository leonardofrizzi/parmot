"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Solicitacao } from "@/types/database"
import { ArrowLeft, Calendar, MapPin, Coins, Lock, Unlock, Shield, Users, AlertCircle, Video, Building, Navigation, Phone, Mail, User, MessageCircle } from "lucide-react"
import { IconRenderer } from "@/components/IconRenderer"
import DistanciaIndicador from "@/components/DistanciaIndicador"

interface Resposta {
  id: string
  profissional_id: string
  profissional_nome: string
  contato_liberado: boolean
  created_at: string
}

interface Configuracoes {
  custo_contato_normal: number
  custo_contato_exclusivo: number
  max_profissionais_por_solicitacao: number
  percentual_reembolso: number
  dias_para_reembolso: number
}

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
  const [config, setConfig] = useState<Configuracoes>({
    custo_contato_normal: 15,
    custo_contato_exclusivo: 50,
    max_profissionais_por_solicitacao: 4,
    percentual_reembolso: 30,
    dias_para_reembolso: 7
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
    const custo = exclusivo ? config.custo_contato_exclusivo : config.custo_contato_normal

    if (profissional.saldo_moedas < custo) {
      setError(`Saldo insuficiente. Você precisa de ${custo} moedas.`)
      return
    }

    if (window.confirm(
      `Deseja liberar o contato ${exclusivo ? 'COM EXCLUSIVIDADE' : ''} por ${custo} moedas?\n\n` +
      (exclusivo ? 'Apenas você terá acesso ao contato do cliente!' : `Até ${config.max_profissionais_por_solicitacao} profissionais podem liberar este contato.`)
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

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const vagasDisponiveis = config.max_profissionais_por_solicitacao - respostas.length
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
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button variant="outline" onClick={() => router.back()} className="mb-4 md:mb-6">
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
                <IconRenderer name={solicitacao.categoria_icone} size={32} />
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

            {/* Modalidade de atendimento */}
            {(solicitacao as any).modalidade && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Modalidade de atendimento</h3>
                <div className="flex items-center gap-2">
                  {(solicitacao as any).modalidade === 'online' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      <Video size={14} />
                      Online
                    </span>
                  )}
                  {(solicitacao as any).modalidade === 'presencial' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <Building size={14} />
                      Presencial
                    </span>
                  )}
                  {(solicitacao as any).modalidade === 'ambos' && (
                    <>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        <Video size={14} />
                        Online
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        <Building size={14} />
                        Presencial
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Distância do profissional até o cliente */}
            {((solicitacao as any).cliente_cep || (solicitacao.cliente_cidade && solicitacao.cliente_estado)) && profissional && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Distância até o serviço</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Navigation size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-600 text-sm">De:</span>
                      <span className="font-medium">{profissional.cidade}, {profissional.estado}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-600 text-sm">Para:</span>
                      <span className="font-medium">{solicitacao.cliente_cidade}, {solicitacao.cliente_estado}</span>
                    </div>
                    <div className="text-lg font-bold">
                      <DistanciaIndicador
                        cepOrigem={profissional.cep}
                        cidadeOrigem={profissional.cidade}
                        estadoOrigem={profissional.estado}
                        cepDestino={(solicitacao as any).cliente_cep}
                        cidadeDestino={solicitacao.cliente_cidade || ''}
                        estadoDestino={solicitacao.cliente_estado || ''}
                        showIcon={false}
                        className="text-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados do Cliente - Mostrar PRIMEIRO quando já liberou */}
        {jaLiberou && (
          <Card className="mb-4 md:mb-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-green-800">Dados do Cliente</CardTitle>
                  <CardDescription className="text-green-600">Contato liberado com sucesso!</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(solicitacao as any).cliente_nome ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <User size={18} className="text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Nome</p>
                      <p className="font-semibold text-gray-900">{(solicitacao as any).cliente_nome}</p>
                    </div>
                  </div>

                  {(solicitacao as any).cliente_telefone && (
                    <a
                      href={`https://wa.me/55${(solicitacao as any).cliente_telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-green-50 transition-colors group"
                    >
                      <MessageCircle size={18} className="text-green-600" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">WhatsApp</p>
                        <p className="font-semibold text-gray-900">{(solicitacao as any).cliente_telefone}</p>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Abrir WhatsApp
                      </Button>
                    </a>
                  )}

                  {(solicitacao as any).cliente_email && (
                    <a
                      href={`mailto:${(solicitacao as any).cliente_email}`}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Mail size={18} className="text-blue-600" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-semibold text-gray-900">{(solicitacao as any).cliente_email}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Enviar Email
                      </Button>
                    </a>
                  )}
                </>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                  <p>Carregando dados do cliente... Se persistir, atualize a página.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status de Vagas */}
        <Card className="mb-4 md:mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users size={20} className="text-blue-600 md:hidden" />
                  <Users size={24} className="text-blue-600 hidden md:block" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {vagasDisponiveis} {vagasDisponiveis === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {respostas.length} de {config.max_profissionais_por_solicitacao} profissionais já liberaram
                  </p>
                </div>
              </div>
              {jaLiberou && (
                <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1 w-fit">
                  <Unlock size={14} />
                  Você já liberou
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações de Liberação - Design mobile-first */}
        {!jaLiberou && (
          <div className="space-y-4 mb-4 md:mb-6">
            {/* Botões rápidos para mobile - aparecem primeiro */}
            <div className="md:hidden space-y-3">
              <Button
                onClick={() => handleLiberar(false)}
                disabled={!podeLiberar || unlocking || profissional.saldo_moedas < config.custo_contato_normal || !profissional.aprovado}
                className="w-full h-14 text-base"
                size="lg"
              >
                <Coins size={20} className="mr-2" />
                {unlocking ? "Liberando..." : `Liberar por ${config.custo_contato_normal} moedas`}
              </Button>
              <Button
                onClick={() => handleLiberar(true)}
                disabled={!podeLiberar || unlocking || profissional.saldo_moedas < config.custo_contato_exclusivo || !profissional.aprovado}
                className="w-full h-14 text-base bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                size="lg"
              >
                <Shield size={20} className="mr-2" />
                {unlocking ? "Liberando..." : `Exclusivo por ${config.custo_contato_exclusivo} moedas`}
              </Button>
              {profissional.saldo_moedas < config.custo_contato_normal && (
                <p className="text-xs text-red-600 text-center">Saldo insuficiente</p>
              )}
              {!profissional.aprovado && (
                <p className="text-xs text-yellow-600 text-center">Aguardando aprovação da conta</p>
              )}
            </div>

            {/* Cards detalhados para desktop */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
              {/* Liberação Normal */}
              <Card className={`border-2 transition-all ${!podeLiberar ? 'opacity-50' : 'hover:border-primary-300 hover:shadow-md'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">Contato Padrão</CardTitle>
                    <div className="flex items-center gap-1 text-orange-600 font-bold text-xl">
                      <Coins size={20} />
                      {config.custo_contato_normal}
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
                      <span>Até {config.max_profissionais_por_solicitacao} profissionais podem liberar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">⚠</span>
                      <span>Outros profissionais podem concorrer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">ℹ</span>
                      <span>Reembolso de {config.percentual_reembolso}% se não fechar negócio</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleLiberar(false)}
                    disabled={!podeLiberar || unlocking || profissional.saldo_moedas < config.custo_contato_normal || !profissional.aprovado}
                    className="w-full"
                  >
                    {unlocking ? "Liberando..." : !profissional.aprovado ? "Conta pendente" : `Liberar por ${config.custo_contato_normal} moedas`}
                  </Button>
                  {profissional.saldo_moedas < config.custo_contato_normal && (
                    <p className="text-xs text-red-600 mt-2 text-center">Saldo insuficiente</p>
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
                      {config.custo_contato_exclusivo}
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
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">ℹ</span>
                      <span className="font-medium">Reembolso de {config.percentual_reembolso}% se não fechar negócio</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleLiberar(true)}
                    disabled={!podeLiberar || unlocking || profissional.saldo_moedas < config.custo_contato_exclusivo || !profissional.aprovado}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                  >
                    {unlocking ? "Liberando..." : !profissional.aprovado ? "Conta pendente" : `Exclusividade por ${config.custo_contato_exclusivo} moedas`}
                  </Button>
                  {profissional.saldo_moedas < config.custo_contato_exclusivo && (
                    <p className="text-xs text-red-600 mt-2 text-center">Saldo insuficiente</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!podeLiberar && !jaLiberou && (
          <Card className="mb-4 md:mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-800">
                <Lock size={20} className="flex-shrink-0" />
                <p className="font-medium text-sm md:text-base">
                  Esta solicitação já atingiu o limite de {config.max_profissionais_por_solicitacao} profissionais interessados.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações do seu saldo */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Coins size={20} className="text-orange-600 md:hidden" />
                  <Coins size={24} className="text-orange-600 hidden md:block" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Seu saldo atual</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{profissional.saldo_moedas} moedas</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/profissional/moedas')}
                className="w-full sm:w-auto"
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
