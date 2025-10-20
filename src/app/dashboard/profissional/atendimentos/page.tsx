"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Search, Phone, Mail, User, Crown, Users } from "lucide-react"
import * as Icons from "lucide-react"

type FiltroStatus = "todos" | "aberta" | "em_andamento" | "concluida" | "cancelada"

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
}

export default function AtendimentosProfissional() {
  const router = useRouter()
  const [profissional, setProfissional] = useState<any>(null)
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos")

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      aberta: { label: "Em aberto", color: "bg-blue-100 text-blue-700" },
      em_andamento: { label: "Em andamento", color: "bg-yellow-100 text-yellow-700" },
      concluida: { label: "Concluída", color: "bg-green-100 text-green-700" },
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
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-600">Carregando atendimentos...</p>
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
                    <SelectItem value="concluida">Concluída</SelectItem>
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
                    {atendimentos.filter(a => a.status === 'concluida').length}
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

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Solicitado em {formatData(atendimento.data_solicitacao)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
