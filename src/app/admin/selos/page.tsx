"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Award, Plus, Trash2, Edit2, Star, User, Calendar, XCircle, CheckCircle2, Search } from "lucide-react"
import { StarRating } from "@/components/StarRating"

// ===== Interfaces =====

interface TipoSelo {
  id: string
  nome: string
  descricao: string | null
  cor: string
  ativo: boolean
  created_at: string
}

interface SeloAtribuido {
  id: string
  profissional_id: string
  tipo: string
  tipo_selo_id: string | null
  data_inicio: string
  data_fim: string
  media_avaliacoes: number
  total_avaliacoes: number
  ativo: boolean
  motivo: string | null
  created_at: string
  profissional_nome: string
  tipo_selo_nome: string
  tipo_selo_cor: string
}

interface Avaliacao {
  id: string
  profissional_id: string
  cliente_id: string
  nota: number
  comentario: string | null
  resposta_profissional: string | null
  created_at: string
  profissional_nome: string
  cliente_nome: string
}

interface ProfissionalResumido {
  id: string
  nome: string
  email: string
  cidade: string
  estado: string
}

// ===== Helper: cores dos selos =====

const coresDisponiveis = [
  { value: 'amber', label: 'Dourado', gradient: 'from-amber-400 to-yellow-500', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  { value: 'blue', label: 'Azul', gradient: 'from-blue-400 to-blue-600', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { value: 'green', label: 'Verde', gradient: 'from-green-400 to-emerald-500', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { value: 'purple', label: 'Roxo', gradient: 'from-purple-400 to-purple-600', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { value: 'red', label: 'Vermelho', gradient: 'from-red-400 to-red-600', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  { value: 'pink', label: 'Rosa', gradient: 'from-pink-400 to-pink-600', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
]

function getCorConfig(cor: string) {
  return coresDisponiveis.find(c => c.value === cor) || coresDisponiveis[0]
}

// ===== Componente Principal =====

export default function AdminSelos() {
  // === State: Tipos de selo ===
  const [tiposSelo, setTiposSelo] = useState<TipoSelo[]>([])
  const [loadingTipos, setLoadingTipos] = useState(true)
  const [showDialogTipo, setShowDialogTipo] = useState(false)
  const [editandoTipo, setEditandoTipo] = useState<TipoSelo | null>(null)
  const [formTipo, setFormTipo] = useState({ nome: '', descricao: '', cor: 'amber' })

  // === State: Selos atribuídos ===
  const [selos, setSelos] = useState<SeloAtribuido[]>([])
  const [loadingSelos, setLoadingSelos] = useState(true)
  const [filtroSelos, setFiltroSelos] = useState<'todos' | 'ativos' | 'revogados'>('ativos')
  const [showDialogRevogar, setShowDialogRevogar] = useState(false)
  const [seloParaRevogar, setSeloParaRevogar] = useState<SeloAtribuido | null>(null)

  // === State: Atribuir selo ===
  const [profissionais, setProfissionais] = useState<ProfissionalResumido[]>([])
  const [profSelecionado, setProfSelecionado] = useState<string>('')
  const [tipoSeloSelecionado, setTipoSeloSelecionado] = useState<string>('')
  const [motivoSelo, setMotivoSelo] = useState('')
  const [buscaProf, setBuscaProf] = useState('')
  const [showProfDropdown, setShowProfDropdown] = useState(false)
  const [loadingAtribuir, setLoadingAtribuir] = useState(false)

  // === State: Avaliações ===
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false)
  const [filtroAvalProf, setFiltroAvalProf] = useState<string>('')
  const [estatisticas, setEstatisticas] = useState({ total: 0, media: 0, distribuicao: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })

  // === State geral ===
  const [loadingAcao, setLoadingAcao] = useState(false)

  // ===== Fetch functions =====

  const fetchTiposSelo = async () => {
    try {
      const res = await fetch('/api/admin/selos/tipos')
      const data = await res.json()
      if (res.ok) {
        const tipos = data.tipos || []
        setTiposSelo(tipos)
        // Auto-selecionar se só tem 1 tipo ativo
        const ativos = tipos.filter((t: TipoSelo) => t.ativo)
        if (ativos.length === 1 && !tipoSeloSelecionado) {
          setTipoSeloSelecionado(ativos[0].id)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar tipos de selo:', err)
    }
    setLoadingTipos(false)
  }

  const fetchSelos = async () => {
    try {
      const ativoParam = filtroSelos === 'ativos' ? '&ativo=true' : filtroSelos === 'revogados' ? '&ativo=false' : ''
      const res = await fetch(`/api/admin/selos?${ativoParam}`)
      const data = await res.json()
      if (res.ok) setSelos(data.selos || [])
    } catch (err) {
      console.error('Erro ao buscar selos:', err)
    }
    setLoadingSelos(false)
  }

  const fetchProfissionais = async () => {
    try {
      const res = await fetch('/api/admin/profissionais?filtro=aprovados')
      const data = await res.json()
      if (res.ok) setProfissionais(data.profissionais || [])
    } catch (err) {
      console.error('Erro ao buscar profissionais:', err)
    }
  }

  const fetchAvaliacoes = async (profId?: string) => {
    setLoadingAvaliacoes(true)
    try {
      const url = profId ? `/api/admin/avaliacoes?profissional_id=${profId}` : '/api/admin/avaliacoes'
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        setAvaliacoes(data.avaliacoes || [])
        setEstatisticas(data.estatisticas || { total: 0, media: 0, distribuicao: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
      }
    } catch (err) {
      console.error('Erro ao buscar avaliações:', err)
    }
    setLoadingAvaliacoes(false)
  }

  useEffect(() => {
    fetchTiposSelo()
    fetchProfissionais()
    fetchAvaliacoes()
  }, [])

  useEffect(() => {
    fetchSelos()
  }, [filtroSelos])

  // ===== Handlers: Tipos de Selo =====

  const handleSalvarTipo = async () => {
    if (!formTipo.nome.trim()) return
    setLoadingAcao(true)
    try {
      if (editandoTipo) {
        const res = await fetch(`/api/admin/selos/tipos/${editandoTipo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formTipo)
        })
        if (res.ok) {
          fetchTiposSelo()
          setShowDialogTipo(false)
          setEditandoTipo(null)
          setFormTipo({ nome: '', descricao: '', cor: 'amber' })
        }
      } else {
        const res = await fetch('/api/admin/selos/tipos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formTipo)
        })
        if (res.ok) {
          fetchTiposSelo()
          setShowDialogTipo(false)
          setFormTipo({ nome: '', descricao: '', cor: 'amber' })
        }
      }
    } catch (err) {
      console.error('Erro ao salvar tipo de selo:', err)
    }
    setLoadingAcao(false)
  }

  const handleDeletarTipo = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este tipo de selo?')) return
    setLoadingAcao(true)
    try {
      const res = await fetch(`/api/admin/selos/tipos/${id}`, { method: 'DELETE' })
      if (res.ok) fetchTiposSelo()
    } catch (err) {
      console.error('Erro ao deletar tipo:', err)
    }
    setLoadingAcao(false)
  }

  // ===== Handler: Atribuir Selo =====

  const handleAtribuirSelo = async () => {
    if (!profSelecionado || !tipoSeloSelecionado) {
      alert('Selecione um profissional e um tipo de selo')
      return
    }
    setLoadingAtribuir(true)
    try {
      const adminData = localStorage.getItem('admin')
      const admin = adminData ? JSON.parse(adminData) : null

      const res = await fetch('/api/admin/selos/atribuir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profissional_id: profSelecionado,
          tipo_selo_id: tipoSeloSelecionado,
          motivo: motivoSelo,
          admin_id: admin?.id
        })
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        setProfSelecionado('')
        setTipoSeloSelecionado('')
        setMotivoSelo('')
        setBuscaProf('')
        fetchSelos()
      } else {
        alert(data.error || 'Erro ao atribuir selo')
      }
    } catch (err) {
      console.error('Erro ao atribuir selo:', err)
    }
    setLoadingAtribuir(false)
  }

  // ===== Handler: Revogar Selo =====

  const handleRevogarSelo = async () => {
    if (!seloParaRevogar) return
    setLoadingAcao(true)
    try {
      const res = await fetch('/api/admin/selos/revogar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selo_id: seloParaRevogar.id })
      })
      if (res.ok) {
        fetchSelos()
        setShowDialogRevogar(false)
        setSeloParaRevogar(null)
      }
    } catch (err) {
      console.error('Erro ao revogar selo:', err)
    }
    setLoadingAcao(false)
  }

  // ===== Helpers =====

  const profsFiltrados = profissionais.filter(p =>
    p.nome.toLowerCase().includes(buscaProf.toLowerCase()) ||
    p.email.toLowerCase().includes(buscaProf.toLowerCase())
  )

  const tiposAtivos = tiposSelo.filter(t => t.ativo)

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // ===== Render =====

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Award className="text-amber-500" size={32} />
            Gerenciar Selos
          </h1>
          <p className="text-gray-600">Crie tipos de selo, atribua a profissionais e acompanhe as avaliações</p>
        </div>

        <Tabs defaultValue="tipos" className="space-y-6">
          <TabsList className="flex flex-col md:grid md:grid-cols-4 h-auto bg-gray-100 p-1.5 rounded-xl gap-1 w-full">
            <TabsTrigger value="tipos" className="w-full rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 text-gray-500 font-medium text-sm transition-all px-3 py-2.5">
              <Award size={16} className="mr-1.5" />
              Tipos de Selo
            </TabsTrigger>
            <TabsTrigger value="atribuir" className="w-full rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 text-gray-500 font-medium text-sm transition-all px-3 py-2.5">
              <Plus size={16} className="mr-1.5" />
              Atribuir Selo
            </TabsTrigger>
            <TabsTrigger value="ativos" className="w-full rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 text-gray-500 font-medium text-sm transition-all px-3 py-2.5">
              <CheckCircle2 size={16} className="mr-1.5" />
              Atribuídos
            </TabsTrigger>
            <TabsTrigger value="avaliacoes" className="w-full rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-gray-900 text-gray-500 font-medium text-sm transition-all px-3 py-2.5">
              <Star size={16} className="mr-1.5" />
              Avaliações
            </TabsTrigger>
          </TabsList>

          {/* ==================== ABA 1: TIPOS DE SELO ==================== */}
          <TabsContent value="tipos">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tipos de Selo</h2>
              <Button onClick={() => {
                setEditandoTipo(null)
                setFormTipo({ nome: '', descricao: '', cor: 'amber' })
                setShowDialogTipo(true)
              }}>
                <Plus size={16} className="mr-1" />
                Novo Tipo
              </Button>
            </div>

            {loadingTipos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                ))}
              </div>
            ) : tiposSelo.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Award size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Nenhum tipo de selo criado ainda.</p>
                  <p className="text-gray-400 text-sm mt-1">Crie seu primeiro tipo de selo para começar.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tiposSelo.map(tipo => {
                  const corConfig = getCorConfig(tipo.cor)
                  return (
                    <Card key={tipo.id} className={`hover:shadow-md transition-shadow ${!tipo.ativo ? 'opacity-50' : ''}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${corConfig.gradient} rounded-full flex items-center justify-center`}>
                              <Award size={20} className="text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{tipo.nome}</h3>
                              {!tipo.ativo && <Badge variant="outline" className="text-xs text-gray-400">Inativo</Badge>}
                            </div>
                          </div>
                        </div>
                        {tipo.descricao && (
                          <p className="text-sm text-gray-600 mb-3">{tipo.descricao}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge className={`${corConfig.bg} ${corConfig.text} ${corConfig.border} border`}>
                            {corConfig.label}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                            setEditandoTipo(tipo)
                            setFormTipo({ nome: tipo.nome, descricao: tipo.descricao || '', cor: tipo.cor })
                            setShowDialogTipo(true)
                          }}>
                            <Edit2 size={14} className="mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleDeletarTipo(tipo.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* ==================== ABA 2: ATRIBUIR SELO ==================== */}
          <TabsContent value="atribuir">
            <Card>
              <CardHeader>
                <CardTitle>Atribuir Selo a Profissional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {tiposAtivos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Award size={48} className="mx-auto text-gray-300 mb-4" />
                    <p>Crie um tipo de selo primeiro na aba &quot;Tipos de Selo&quot;.</p>
                  </div>
                ) : (
                  <>
                    {/* Selecionar tipo de selo */}
                    <div className="space-y-2">
                      <Label>Tipo de Selo <span className="text-red-500">*</span></Label>
                      {!tipoSeloSelecionado && tiposAtivos.length > 1 && (
                        <p className="text-sm text-gray-500">Selecione um tipo de selo abaixo</p>
                      )}
                      <div className="flex flex-col gap-2">
                        {tiposAtivos.map(tipo => {
                          const corConfig = getCorConfig(tipo.cor)
                          const selecionado = tipoSeloSelecionado === tipo.id
                          return (
                            <button
                              key={tipo.id}
                              onClick={() => setTipoSeloSelecionado(tipo.id)}
                              className={`w-full p-3 rounded-lg border-2 transition-all cursor-pointer text-left ${
                                selecionado
                                  ? `${corConfig.bg} ${corConfig.border} shadow-sm`
                                  : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Radio visual */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  selecionado ? `${corConfig.border} ${corConfig.bg}` : 'border-gray-300'
                                }`}>
                                  {selecionado && <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${corConfig.gradient}`} />}
                                </div>
                                <div className={`w-8 h-8 bg-gradient-to-br ${corConfig.gradient} rounded-full flex items-center justify-center shrink-0`}>
                                  <Award size={14} className="text-white" />
                                </div>
                                <span className="font-medium text-sm">{tipo.nome}</span>
                                {selecionado && <CheckCircle2 size={16} className={`ml-auto ${corConfig.text}`} />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Selecionar profissional */}
                    <div className="space-y-2">
                      <Label>Profissional <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Buscar profissional..."
                          value={buscaProf}
                          onChange={(e) => {
                            setBuscaProf(e.target.value)
                            setShowProfDropdown(true)
                            if (!e.target.value) {
                              setProfSelecionado('')
                            }
                          }}
                          onFocus={() => {
                            if (buscaProf) setShowProfDropdown(true)
                          }}
                          className="pl-9"
                        />
                      </div>
                      {showProfDropdown && buscaProf && (
                        <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                          {profsFiltrados.length === 0 ? (
                            <p className="p-3 text-sm text-gray-500">Nenhum profissional encontrado</p>
                          ) : (
                            profsFiltrados.slice(0, 10).map(prof => (
                              <button
                                key={prof.id}
                                onClick={() => {
                                  setProfSelecionado(prof.id)
                                  setBuscaProf(prof.nome)
                                  setShowProfDropdown(false)
                                }}
                                className={`w-full p-3 text-left hover:bg-gray-50 text-sm ${
                                  profSelecionado === prof.id ? 'bg-primary-50' : ''
                                }`}
                              >
                                <span className="font-medium">{prof.nome}</span>
                                <span className="text-gray-500 ml-2">{prof.email}</span>
                                <span className="text-gray-400 ml-2">({prof.cidade}/{prof.estado})</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      {profSelecionado && !showProfDropdown && (
                        <p className="text-sm text-green-600">
                          <CheckCircle2 size={14} className="inline mr-1" />
                          Profissional selecionado
                        </p>
                      )}
                    </div>

                    {/* Motivo */}
                    <div className="space-y-2">
                      <Label>Motivo (opcional)</Label>
                      <Textarea
                        placeholder="Ex: Excelente desempenho na avaliação semestral..."
                        value={motivoSelo}
                        onChange={(e) => setMotivoSelo(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleAtribuirSelo}
                      disabled={loadingAtribuir || !profSelecionado || !tipoSeloSelecionado}
                    >
                      <Award size={16} className="mr-2" />
                      {loadingAtribuir ? 'Atribuindo...' : 'Atribuir Selo'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== ABA 3: SELOS ATRIBUÍDOS ==================== */}
          <TabsContent value="ativos">
            <div className="flex gap-2 mb-4">
              {(['ativos', 'revogados', 'todos'] as const).map(f => (
                <Button
                  key={f}
                  variant={filtroSelos === f ? 'default' : 'outline'}
                  onClick={() => setFiltroSelos(f)}
                  size="sm"
                >
                  {f === 'ativos' ? 'Ativos' : f === 'revogados' ? 'Revogados' : 'Todos'}
                </Button>
              ))}
            </div>

            {loadingSelos ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : selos.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Award size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Nenhum selo encontrado.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {selos.map(selo => {
                  const corConfig = getCorConfig(selo.tipo_selo_cor)
                  return (
                    <Card key={selo.id} className={!selo.ativo ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${corConfig.gradient} rounded-full flex items-center justify-center`}>
                              <Award size={22} className="text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{selo.profissional_nome}</h3>
                                <Badge className={`bg-gradient-to-r ${corConfig.gradient} text-white border-0 text-xs`}>
                                  {selo.tipo_selo_nome}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {formatData(selo.data_inicio)} - {formatData(selo.data_fim)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                  {selo.media_avaliacoes} ({selo.total_avaliacoes} aval.)
                                </span>
                              </div>
                              {selo.motivo && (
                                <p className="text-xs text-gray-400 mt-1">Motivo: {selo.motivo}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selo.ativo ? (
                              <>
                                <Badge className="bg-green-100 text-green-700 border-green-300">Ativo</Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setSeloParaRevogar(selo)
                                    setShowDialogRevogar(true)
                                  }}
                                >
                                  <XCircle size={14} className="mr-1" />
                                  Revogar
                                </Button>
                              </>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500">Revogado</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* ==================== ABA 4: AVALIAÇÕES ==================== */}
          <TabsContent value="avaliacoes">
            {/* Filtro por profissional */}
            <div className="mb-6">
              <Label className="mb-2 block">Filtrar por profissional</Label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={filtroAvalProf}
                onChange={(e) => {
                  setFiltroAvalProf(e.target.value)
                  fetchAvaliacoes(e.target.value || undefined)
                }}
              >
                <option value="">Todos os profissionais</option>
                {profissionais.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            {/* Estatísticas */}
            {avaliacoes.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">{estatisticas.media.toFixed(1)}</p>
                    <StarRating rating={estatisticas.media} readonly size={16} />
                    <p className="text-xs text-gray-500 mt-1">Média geral</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">{estatisticas.total}</p>
                    <p className="text-xs text-gray-500 mt-1">Total de avaliações</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {estatisticas.total > 0 ? Math.round((estatisticas.distribuicao[5] / estatisticas.total) * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">5 estrelas</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Lista de avaliações */}
            {loadingAvaliacoes ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : avaliacoes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Star size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {filtroAvalProf ? 'Nenhuma avaliação encontrada para este profissional.' : 'Nenhuma avaliação encontrada.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {avaliacoes.map(av => (
                  <Card key={av.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <StarRating rating={av.nota} readonly size={16} />
                            <Badge variant="outline" className="text-xs">
                              {av.nota}/5
                            </Badge>
                          </div>
                          {av.comentario && (
                            <p className="text-sm text-gray-700 mb-2">&quot;{av.comentario}&quot;</p>
                          )}
                          {av.resposta_profissional && (
                            <div className="bg-gray-50 rounded p-2 text-xs text-gray-600 mb-2">
                              <span className="font-medium">Resposta do profissional:</span> {av.resposta_profissional}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              Cliente: {av.cliente_nome}
                            </span>
                            {!filtroAvalProf && (
                              <span className="flex items-center gap-1">
                                <Award size={12} />
                                Profissional: {av.profissional_nome}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatData(av.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ===== DIALOGS ===== */}

        {/* Dialog: Criar/Editar Tipo de Selo */}
        <Dialog open={showDialogTipo} onOpenChange={(open) => {
          setShowDialogTipo(open)
          if (!open) {
            setEditandoTipo(null)
            setFormTipo({ nome: '', descricao: '', cor: 'amber' })
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editandoTipo ? 'Editar Tipo de Selo' : 'Novo Tipo de Selo'}</DialogTitle>
              <DialogDescription>
                {editandoTipo ? 'Atualize as informações do tipo de selo.' : 'Crie um novo tipo de selo para atribuir aos profissionais.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Ex: Destaque Semestral"
                  value={formTipo.nome}
                  onChange={(e) => setFormTipo({ ...formTipo, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descrição do tipo de selo..."
                  value={formTipo.descricao}
                  onChange={(e) => setFormTipo({ ...formTipo, descricao: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="grid grid-cols-3 gap-2">
                  {coresDisponiveis.map(cor => (
                    <button
                      key={cor.value}
                      onClick={() => setFormTipo({ ...formTipo, cor: cor.value })}
                      className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                        formTipo.cor === cor.value
                          ? `${cor.border} ${cor.bg}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-gradient-to-br ${cor.gradient} rounded-full`} />
                      <span className="text-sm">{cor.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialogTipo(false)} disabled={loadingAcao}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarTipo} disabled={loadingAcao || !formTipo.nome.trim()}>
                {loadingAcao ? 'Salvando...' : (editandoTipo ? 'Atualizar' : 'Criar Tipo')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Revogar Selo */}
        <Dialog open={showDialogRevogar} onOpenChange={setShowDialogRevogar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revogar Selo</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja revogar o selo <strong>{seloParaRevogar?.tipo_selo_nome}</strong> de <strong>{seloParaRevogar?.profissional_nome}</strong>?
                O selo deixará de aparecer no perfil do profissional.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialogRevogar(false)} disabled={loadingAcao}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleRevogarSelo} disabled={loadingAcao}>
                {loadingAcao ? 'Revogando...' : 'Confirmar Revogação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
