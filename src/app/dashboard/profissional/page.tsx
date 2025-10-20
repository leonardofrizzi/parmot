"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Search, CheckCircle, TrendingUp, Calendar, MapPin } from "lucide-react"

interface Profissional {
  id: string
  tipo: string
  nome: string
  razao_social?: string
  email: string
  telefone: string
  cpf_cnpj: string
  cidade: string
  estado: string
  saldo_moedas: number
}

interface Stats {
  solicitacoes_disponiveis: number
  contatos_liberados: number
  moedas_gastas: number
}

export default function DashboardProfissional() {
  const router = useRouter()
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [stats, setStats] = useState<Stats>({ solicitacoes_disponiveis: 0, contatos_liberados: 0, moedas_gastas: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setProfissional(user)
      fetchStats(user.id)
    }
  }, [])

  const fetchStats = async (profissionalId: string) => {
    try {
      // TODO: Implementar API para buscar estatísticas
      // Por enquanto, valores mockados
      setStats({
        solicitacoes_disponiveis: 0,
        contatos_liberados: 0,
        moedas_gastas: 0
      })
      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      setLoading(false)
    }
  }

  if (!profissional) {
    return <div className="flex items-center justify-center h-full">Carregando...</div>
  }

  return (
    <div className="p-8">
      {/* Header da página */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Olá, {profissional.nome.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">
          {profissional.cidade && profissional.estado
            ? `${profissional.cidade}, ${profissional.estado} • Bem-vindo ao seu painel`
            : 'Bem-vindo ao seu painel de controle'}
        </p>
      </div>

      {/* Saldo de Moedas - Destaque */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Coins size={24} />
                  <p className="text-yellow-50 text-sm font-medium">Saldo de Moedas</p>
                </div>
                <p className="text-5xl font-bold mb-2">{profissional.saldo_moedas}</p>
                <p className="text-yellow-50 text-sm mb-4">
                  Use moedas para liberar contatos de clientes
                </p>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/dashboard/profissional/moedas')}
                  className="bg-white text-orange-600 hover:bg-yellow-50"
                >
                  <Coins size={16} className="mr-2" />
                  Comprar Moedas
                </Button>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center">
                  <Coins size={64} className="text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Solicitações Disponíveis</p>
                <p className="text-3xl font-bold text-gray-900">{stats.solicitacoes_disponiveis}</p>
                <p className="text-xs text-gray-500 mt-1">Na sua região</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Search className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contatos Liberados</p>
                <p className="text-3xl font-bold text-green-600">{stats.contatos_liberados}</p>
                <p className="text-xs text-gray-500 mt-1">Este mês</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Moedas Gastas</p>
                <p className="text-3xl font-bold text-orange-600">{stats.moedas_gastas}</p>
                <p className="text-xs text-gray-500 mt-1">Este mês</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-orange-600" size={24} />
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
                <h3 className="text-xl font-bold mb-2">Encontre novos clientes</h3>
                <p className="text-primary-50 mb-4">
                  Navegue pelas solicitações disponíveis na sua região
                </p>
                <Button
                  variant="secondary"
                  onClick={() => router.push('/dashboard/profissional/solicitacoes')}
                  className="bg-white text-primary-600 hover:bg-primary-50"
                >
                  <Search size={16} className="mr-2" />
                  Ver Solicitações
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Perfil */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
            <CardDescription>Suas informações cadastrais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Tipo de Cadastro</p>
              <p className="font-medium capitalize">{profissional.tipo === 'autonomo' ? 'Autônomo' : 'Empresa'}</p>
            </div>
            {profissional.razao_social && (
              <div>
                <p className="text-sm text-gray-500">Razão Social</p>
                <p className="font-medium">{profissional.razao_social}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">{profissional.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{profissional.tipo === 'autonomo' ? 'CPF' : 'CNPJ'}</p>
              <p className="font-medium">{profissional.cpf_cnpj}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profissional.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="font-medium">{profissional.telefone}</p>
            </div>
            {profissional.cidade && profissional.estado && (
              <div>
                <p className="text-sm text-gray-500">Localização</p>
                <p className="font-medium flex items-center gap-1">
                  <MapPin size={14} />
                  {profissional.cidade}, {profissional.estado}
                </p>
              </div>
            )}
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/dashboard/profissional/perfil')}
              >
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
            <CardDescription>Passos para conseguir clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Navegue pelas solicitações</p>
                  <p className="text-sm text-gray-600">Veja solicitações de clientes na sua região</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Use moedas para liberar contato</p>
                  <p className="text-sm text-gray-600">Gaste moedas para ver WhatsApp e email do cliente</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Entre em contato</p>
                  <p className="text-sm text-gray-600">Converse diretamente com o cliente e feche o negócio</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
