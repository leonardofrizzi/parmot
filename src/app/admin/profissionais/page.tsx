"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, XCircle, User, Mail, Phone, MapPin, Briefcase, Clock, FileText, ExternalLink, IdCard, GraduationCap, Building2 } from "lucide-react"

interface Profissional {
  id: string
  tipo: 'autonomo' | 'empresa'
  nome: string
  razao_social?: string
  email: string
  telefone: string
  cpf_cnpj: string
  cidade: string
  estado: string
  aprovado: boolean
  created_at: string
  categorias: string[]
  identidade_frente_url?: string | null
  identidade_verso_url?: string | null
  documento_empresa_url?: string | null
  diplomas_urls?: { frente: string; verso: string | null }[] | null
}

export default function AdminProfissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'aprovados'>('pendentes')
  const [showDialog, setShowDialog] = useState(false)
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<Profissional | null>(null)
  const [loadingAcao, setLoadingAcao] = useState(false)

  useEffect(() => {
    fetchProfissionais()
  }, [filtro])

  const fetchProfissionais = async () => {
    try {
      const response = await fetch(`/api/admin/profissionais?filtro=${filtro}`)
      const data = await response.json()

      if (response.ok) {
        setProfissionais(data.profissionais)
      }
      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar profissionais:', err)
      setLoading(false)
    }
  }

  const handleAprovar = async (profissionalId: string) => {
    setLoadingAcao(true)
    try {
      const response = await fetch('/api/admin/profissionais/aprovar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profissional_id: profissionalId, aprovado: true })
      })

      if (response.ok) {
        fetchProfissionais()
        setShowDialog(false)
      }
    } catch (err) {
      console.error('Erro ao aprovar profissional:', err)
    }
    setLoadingAcao(false)
  }

  const handleReprovar = async (profissionalId: string) => {
    setLoadingAcao(true)
    try {
      const response = await fetch('/api/admin/profissionais/aprovar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profissional_id: profissionalId, aprovado: false })
      })

      if (response.ok) {
        fetchProfissionais()
        setShowDialog(false)
      }
    } catch (err) {
      console.error('Erro ao reprovar profissional:', err)
    }
    setLoadingAcao(false)
  }

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const profissionaisFiltrados = profissionais

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-9 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Profissionais</h1>
          <p className="text-gray-600">Aprovar ou reprovar cadastros de profissionais</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filtro === 'pendentes' ? 'default' : 'outline'}
            onClick={() => setFiltro('pendentes')}
          >
            Pendentes
          </Button>
          <Button
            variant={filtro === 'aprovados' ? 'default' : 'outline'}
            onClick={() => setFiltro('aprovados')}
          >
            Aprovados
          </Button>
          <Button
            variant={filtro === 'todos' ? 'default' : 'outline'}
            onClick={() => setFiltro('todos')}
          >
            Todos
          </Button>
        </div>

        {/* Lista de Profissionais */}
        {profissionaisFiltrados.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum profissional encontrado
              </h3>
              <p className="text-gray-600">
                {filtro === 'pendentes' && 'Não há profissionais aguardando aprovação.'}
                {filtro === 'aprovados' && 'Nenhum profissional foi aprovado ainda.'}
                {filtro === 'todos' && 'Nenhum profissional cadastrado no sistema.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profissionaisFiltrados.map((prof) => (
              <Card key={prof.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{prof.nome}</CardTitle>
                    {prof.aprovado ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle2 size={12} className="mr-1" />
                        Aprovado
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        <Clock size={12} className="mr-1" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} />
                      <span className="truncate">{prof.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} />
                      <span>{prof.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={14} />
                      <span>{prof.cidade}, {prof.estado}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase size={14} />
                      <span>{prof.tipo === 'empresa' ? `Empresa: ${prof.razao_social || 'N/A'}` : 'Autônomo'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <IdCard size={14} />
                      <span>{prof.tipo === 'empresa' ? 'CNPJ' : 'CPF'}: {prof.cpf_cnpj}</span>
                    </div>
                  </div>

                  {prof.categorias && prof.categorias.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 mb-1">Categorias:</p>
                      <div className="flex flex-wrap gap-1">
                        {prof.categorias.slice(0, 3).map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                        {prof.categorias.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{prof.categorias.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documentos */}
                  <div className="pt-2 border-t space-y-2">
                    {/* Documento de Identidade - Frente e Verso */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Documento de Identidade:</p>
                      {prof.identidade_frente_url || prof.identidade_verso_url ? (
                        <div className="space-y-1">
                          {prof.identidade_frente_url && (
                            <a
                              href={prof.identidade_frente_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              <IdCard size={14} />
                              <span>Frente</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {prof.identidade_verso_url && (
                            <a
                              href={prof.identidade_verso_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                            >
                              <IdCard size={14} />
                              <span>Verso</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic flex items-center gap-1">
                          <IdCard size={12} />
                          Não enviado
                        </p>
                      )}
                    </div>

                    {/* Documento da Empresa (apenas para empresas) */}
                    {prof.tipo === 'empresa' && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Documento da Empresa:</p>
                        {prof.documento_empresa_url ? (
                          <a
                            href={prof.documento_empresa_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            <Building2 size={14} />
                            <span>Ver documento</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <p className="text-xs text-gray-500 italic flex items-center gap-1">
                            <Building2 size={12} />
                            Não enviado
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Diplomas/Certificados */}
                  {prof.diplomas_urls && prof.diplomas_urls.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 mb-1">Diplomas/Certificados:</p>
                      <div className="space-y-1">
                        {prof.diplomas_urls.map((diploma, idx) => (
                          <div key={idx} className="space-y-1">
                            <a
                              href={diploma.frente}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <GraduationCap size={14} />
                              <span>Diploma {idx + 1} - Frente</span>
                              <ExternalLink size={12} />
                            </a>
                            {diploma.verso && (
                              <a
                                href={diploma.verso}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline ml-4"
                              >
                                <GraduationCap size={14} />
                                <span>Diploma {idx + 1} - Verso</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex gap-2">
                    {!prof.aprovado ? (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setProfissionalSelecionado(prof)
                            setShowDialog(true)
                          }}
                        >
                          <CheckCircle2 size={16} className="mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleReprovar(prof.id)}
                        >
                          <XCircle size={16} className="mr-1" />
                          Reprovar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleReprovar(prof.id)}
                      >
                        Revogar Aprovação
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 text-center pt-2">
                    Cadastrado em {formatData(prof.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Confirmação */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Profissional</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja aprovar <strong>{profissionalSelecionado?.nome}</strong>?
                O profissional poderá começar a responder solicitações após a aprovação.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loadingAcao}>
                Cancelar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => profissionalSelecionado && handleAprovar(profissionalSelecionado.id)}
                disabled={loadingAcao}
              >
                {loadingAcao ? 'Aprovando...' : 'Confirmar Aprovação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
