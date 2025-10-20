"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Solicitacao } from "@/types/database"
import { Plus, FileText, Users, Clock, CheckCircle, Calendar } from "lucide-react"
import * as Icons from "lucide-react"

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  cidade: string
  estado: string
}

interface Stats {
  total: number
  abertas: number
  em_andamento: number
  finalizadas: number
}

export default function DashboardCliente() {
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, abertas: 0, em_andamento: 0, finalizadas: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setCliente(user)
      fetchSolicitacoes(user.id)
    }
  }, [])

  const fetchSolicitacoes = async (clienteId: string) => {
    try {
      const response = await fetch(`/api/cliente/solicitacoes?cliente_id=${clienteId}`)
      const data = await response.json()

      if (response.ok) {
        const solicitacoesData = data.solicitacoes
        setSolicitacoes(solicitacoesData.slice(0, 5)) // Pegar apenas as 5 mais recentes

        // Calcular estatísticas
        const stats = {
          total: solicitacoesData.length,
          abertas: solicitacoesData.filter((s: any) => s.status === 'aberta').length,
          em_andamento: solicitacoesData.filter((s: any) => s.status === 'em_andamento').length,
          finalizadas: solicitacoesData.filter((s: any) => s.status === 'concluida').length,
        }
        setStats(stats)
      }
      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err)
      setLoading(false)
    }
  }

  const renderIcone = (nomeIcone?: string) => {
    if (!nomeIcone) return null
    const IconComponent = Icons[nomeIcone as keyof typeof Icons] as any
    return IconComponent ? <IconComponent size={16} /> : null
  }

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (!cliente) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>
  }

  return (
    <div className="p-8">
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Olá, {cliente.nome.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">
          {cliente.cidade && cliente.estado
            ? `${cliente.cidade}, ${cliente.estado} • Bem-vindo ao seu painel`
            : 'Bem-vindo ao seu painel de controle'}
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Solicitações</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aguardando</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.abertas}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-3xl font-bold text-blue-600">{stats.em_andamento}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Finalizadas</p>
                <p className="text-3xl font-bold text-green-600">{stats.finalizadas}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ação Rápida */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Precisa de um serviço?</h3>
                <p className="text-primary-50 mb-4">
                  Crie uma nova solicitação e conecte-se com profissionais qualificados
                </p>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/dashboard/cliente/solicitar')}
                  className="bg-white text-primary-600 hover:bg-primary-50"
                >
                  <Plus size={16} className="mr-2" />
                  Nova Solicitação
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solicitações Recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Solicitações Recentes</CardTitle>
              <CardDescription>Suas últimas solicitações de serviço</CardDescription>
            </div>
            {stats.total > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/cliente/solicitacoes')}
              >
                Ver todas
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600 text-center py-8">Carregando...</p>
          ) : solicitacoes.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600 mb-4">Você ainda não tem solicitações</p>
              <Button onClick={() => router.push('/dashboard/cliente/solicitar')}>
                <Plus size={16} className="mr-2" />
                Criar primeira solicitação
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitacoes.map((solicitacao) => (
                <div
                  key={solicitacao.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer"
                  onClick={() => router.push(`/dashboard/cliente/solicitacoes/${solicitacao.id}`)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-primary-600">
                      {renderIcone(solicitacao.categoria_icone)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{solicitacao.titulo}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatData(solicitacao.created_at)}
                        </span>
                        <span>•</span>
                        <span>{solicitacao.categoria_nome}</span>
                        {(solicitacao as any).total_profissionais_interessados > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-green-600 font-semibold">
                              <Users size={12} />
                              {(solicitacao as any).total_profissionais_interessados} profissional(is) interessado(s)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      solicitacao.status === 'aberta' ? 'bg-yellow-100 text-yellow-800' :
                      solicitacao.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                      solicitacao.status === 'finalizada' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {solicitacao.status === 'aberta' ? 'Aberta' :
                       solicitacao.status === 'em_andamento' ? 'Em andamento' :
                       solicitacao.status === 'finalizada' ? 'Finalizada' : 'Cancelada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
