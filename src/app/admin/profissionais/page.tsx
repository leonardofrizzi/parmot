"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, XCircle, User, Mail, Phone, MapPin, Briefcase, Clock, FileText, ExternalLink, IdCard, GraduationCap, Building2, Ban, ShieldOff, FileCheck, Coins, Download } from "lucide-react"
import { gerarComprovantePDF } from "@/lib/gerarComprovantePDF"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
  banido?: boolean
  banido_em?: string
  motivo_banimento?: string
  created_at: string
  categorias: string[]
  identidade_frente_url?: string | null
  identidade_verso_url?: string | null
  documento_empresa_url?: string | null
  diplomas_urls?: (string | { frente: string; verso: string | null })[] | null
  // Aceite dos termos
  termos_aceitos_em?: string | null
  termos_versao?: string | null
  termos_ip?: string | null
}

export default function AdminProfissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'aprovados' | 'banidos'>('pendentes')
  const [showDialog, setShowDialog] = useState(false)
  const [showDialogReprovar, setShowDialogReprovar] = useState(false)
  const [showDialogBanir, setShowDialogBanir] = useState(false)
  const [showDialogMoedas, setShowDialogMoedas] = useState(false)
  const [motivoBanimento, setMotivoBanimento] = useState('')
  const [quantidadeMoedas, setQuantidadeMoedas] = useState('')
  const [motivoMoedas, setMotivoMoedas] = useState('')
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
        console.log('Profissionais recebidos:', data.profissionais)
        if (data.profissionais?.length > 0) {
          console.log('Diplomas do primeiro:', data.profissionais[0]?.diplomas_urls)
        }
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

  const handleReprovar = async () => {
    if (!profissionalSelecionado) return

    setLoadingAcao(true)
    try {
      const response = await fetch('/api/admin/profissionais/deletar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profissional_id: profissionalSelecionado.id })
      })

      if (response.ok) {
        fetchProfissionais()
        setShowDialogReprovar(false)
        setProfissionalSelecionado(null)
      }
    } catch (err) {
      console.error('Erro ao reprovar profissional:', err)
    }
    setLoadingAcao(false)
  }

  const handleBanir = async (banir: boolean) => {
    if (!profissionalSelecionado) return

    setLoadingAcao(true)
    try {
      const response = await fetch('/api/admin/profissionais/banir', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profissional_id: profissionalSelecionado.id,
          banido: banir,
          motivo: motivoBanimento || 'Comportamento não ético'
        })
      })

      if (response.ok) {
        fetchProfissionais()
        setShowDialogBanir(false)
        setProfissionalSelecionado(null)
        setMotivoBanimento('')
      }
    } catch (err) {
      console.error('Erro ao banir profissional:', err)
    }
    setLoadingAcao(false)
  }

  const handleCreditarMoedas = async () => {
    if (!profissionalSelecionado || !quantidadeMoedas) return

    const quantidade = parseInt(quantidadeMoedas)
    if (isNaN(quantidade) || quantidade <= 0) {
      alert('Informe uma quantidade válida de moedas')
      return
    }

    setLoadingAcao(true)
    try {
      const adminData = localStorage.getItem('admin')
      const admin = adminData ? JSON.parse(adminData) : null

      const response = await fetch('/api/admin/profissionais/creditar-moedas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profissional_id: profissionalSelecionado.id,
          quantidade,
          motivo: motivoMoedas || 'Crédito de cortesia',
          admin_id: admin?.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        setShowDialogMoedas(false)
        setProfissionalSelecionado(null)
        setQuantidadeMoedas('')
        setMotivoMoedas('')
      } else {
        alert(data.error || 'Erro ao creditar moedas')
      }
    } catch (err) {
      console.error('Erro ao creditar moedas:', err)
      alert('Erro ao creditar moedas')
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
        <div className="flex gap-2 mb-6 flex-wrap">
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
            variant={filtro === 'banidos' ? 'default' : 'outline'}
            onClick={() => setFiltro('banidos')}
            className={filtro === 'banidos' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-700 hover:bg-red-50'}
          >
            <Ban size={16} className="mr-1" />
            Banidos
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
                    {prof.banido ? (
                      <Badge className="bg-red-100 text-red-700 border-red-300">
                        <Ban size={12} className="mr-1" />
                        Banido
                      </Badge>
                    ) : prof.aprovado ? (
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
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-1">Diplomas/Certificados:</p>
                    {prof.diplomas_urls && prof.diplomas_urls.length > 0 ? (
                      <div className="space-y-1">
                        {prof.diplomas_urls.map((diploma, idx) => {
                          // Suporta tanto strings quanto objetos { frente, verso }
                          const isString = typeof diploma === 'string'
                          const frenteUrl = isString ? diploma : diploma.frente
                          const versoUrl = isString ? null : diploma.verso

                          return (
                            <div key={idx} className="space-y-1">
                              <a
                                href={frenteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                <GraduationCap size={14} />
                                <span>Diploma {idx + 1}{!isString && versoUrl ? ' - Frente' : ''}</span>
                                <ExternalLink size={12} />
                              </a>
                              {versoUrl && (
                                <a
                                  href={versoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                  <GraduationCap size={14} />
                                  <span>Diploma {idx + 1} - Verso</span>
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic flex items-center gap-1">
                        <GraduationCap size={12} />
                        Não enviado
                      </p>
                    )}
                  </div>

                  {/* Aceite dos Termos */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Aceite dos Termos:</p>
                    {prof.termos_aceitos_em ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 text-green-700 font-medium">
                            <FileCheck size={14} />
                            <span>Termos aceitos</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs border-green-400 text-green-700 hover:bg-green-100"
                            onClick={() => gerarComprovantePDF({
                              nome: prof.nome,
                              cpf_cnpj: prof.cpf_cnpj,
                              email: prof.email,
                              tipo: prof.tipo,
                              termos_aceitos_em: prof.termos_aceitos_em!,
                              termos_versao: prof.termos_versao || 'N/A',
                              termos_ip: prof.termos_ip || 'N/A'
                            })}
                          >
                            <Download size={12} className="mr-1" />
                            PDF
                          </Button>
                        </div>
                        <div className="text-gray-600 space-y-0.5">
                          <p>Data: {new Date(prof.termos_aceitos_em).toLocaleString('pt-BR')}</p>
                          <p>Versão: {prof.termos_versao || 'N/A'}</p>
                          <p>IP: {prof.termos_ip || 'N/A'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 italic flex items-center gap-1">
                        <FileCheck size={12} />
                        Cadastro anterior (sem registro de aceite)
                      </p>
                    )}
                  </div>

                  <div className="pt-3 flex flex-col gap-2">
                    {prof.banido ? (
                      // Profissional banido - opção de remover banimento
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => {
                          setProfissionalSelecionado(prof)
                          setShowDialogBanir(true)
                        }}
                      >
                        <ShieldOff size={16} className="mr-1" />
                        Remover Banimento
                      </Button>
                    ) : !prof.aprovado ? (
                      // Profissional pendente - opções aprovar/reprovar
                      <div className="flex gap-2">
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
                          onClick={() => {
                            setProfissionalSelecionado(prof)
                            setShowDialogReprovar(true)
                          }}
                        >
                          <XCircle size={16} className="mr-1" />
                          Reprovar
                        </Button>
                      </div>
                    ) : (
                      // Profissional aprovado - opções dar moedas/revogar/banir
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-amber-400 text-amber-700 hover:bg-amber-50"
                          onClick={() => {
                            setProfissionalSelecionado(prof)
                            setShowDialogMoedas(true)
                          }}
                        >
                          <Coins size={16} className="mr-1" />
                          Dar Moedas
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setProfissionalSelecionado(prof)
                              setShowDialogReprovar(true)
                            }}
                          >
                            Revogar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-red-500 text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setProfissionalSelecionado(prof)
                              setShowDialogBanir(true)
                            }}
                          >
                            <Ban size={16} className="mr-1" />
                            Banir
                          </Button>
                        </div>
                      </div>
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

        {/* Dialog de Confirmação - Aprovar */}
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

        {/* Dialog de Confirmação - Reprovar */}
        <Dialog open={showDialogReprovar} onOpenChange={setShowDialogReprovar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reprovar Profissional</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja reprovar e excluir <strong>{profissionalSelecionado?.nome}</strong>?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialogReprovar(false)} disabled={loadingAcao}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReprovar}
                disabled={loadingAcao}
              >
                {loadingAcao ? 'Removendo...' : 'Confirmar Reprovação'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação - Banir */}
        <Dialog open={showDialogBanir} onOpenChange={(open) => {
          setShowDialogBanir(open)
          if (!open) setMotivoBanimento('')
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {profissionalSelecionado?.banido ? 'Remover Banimento' : 'Banir Profissional'}
              </DialogTitle>
              <DialogDescription>
                {profissionalSelecionado?.banido ? (
                  <>
                    Tem certeza que deseja remover o banimento de <strong>{profissionalSelecionado?.nome}</strong>?
                    O profissional poderá solicitar nova aprovação.
                  </>
                ) : (
                  <>
                    Tem certeza que deseja banir <strong>{profissionalSelecionado?.nome}</strong>?
                    O profissional não poderá mais usar a plataforma.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {!profissionalSelecionado?.banido && (
              <div className="py-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Motivo do banimento (opcional)
                </label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm"
                  rows={3}
                  placeholder="Ex: Comportamento não ético, fraude, spam..."
                  value={motivoBanimento}
                  onChange={(e) => setMotivoBanimento(e.target.value)}
                />
              </div>
            )}

            {profissionalSelecionado?.banido && profissionalSelecionado?.motivo_banimento && (
              <div className="py-4 bg-red-50 rounded-md p-3">
                <p className="text-sm text-gray-700">
                  <strong>Motivo do banimento:</strong> {profissionalSelecionado.motivo_banimento}
                </p>
                {profissionalSelecionado.banido_em && (
                  <p className="text-xs text-gray-500 mt-1">
                    Banido em: {new Date(profissionalSelecionado.banido_em).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialogBanir(false)
                  setMotivoBanimento('')
                }}
                disabled={loadingAcao}
              >
                Cancelar
              </Button>
              <Button
                variant={profissionalSelecionado?.banido ? 'default' : 'destructive'}
                onClick={() => handleBanir(!profissionalSelecionado?.banido)}
                disabled={loadingAcao}
              >
                {loadingAcao
                  ? (profissionalSelecionado?.banido ? 'Removendo...' : 'Banindo...')
                  : (profissionalSelecionado?.banido ? 'Remover Banimento' : 'Confirmar Banimento')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Dar Moedas */}
        <Dialog open={showDialogMoedas} onOpenChange={(open) => {
          setShowDialogMoedas(open)
          if (!open) {
            setQuantidadeMoedas('')
            setMotivoMoedas('')
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Dar Moedas
              </DialogTitle>
              <DialogDescription>
                Creditar moedas para <strong>{profissionalSelecionado?.nome}</strong>.
                Esta ação será registrada no histórico de transações.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quantidade">Quantidade de moedas <span className="text-red-500">*</span></Label>
                <Input
                  id="quantidade"
                  type="number"
                  min="1"
                  placeholder="Ex: 10"
                  value={quantidadeMoedas}
                  onChange={(e) => setQuantidadeMoedas(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo (opcional)</Label>
                <Textarea
                  id="motivo"
                  placeholder="Ex: Compensação por problema com cliente, cortesia, etc."
                  value={motivoMoedas}
                  onChange={(e) => setMotivoMoedas(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialogMoedas(false)
                  setQuantidadeMoedas('')
                  setMotivoMoedas('')
                }}
                disabled={loadingAcao}
              >
                Cancelar
              </Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600"
                onClick={handleCreditarMoedas}
                disabled={loadingAcao || !quantidadeMoedas}
              >
                {loadingAcao ? 'Creditando...' : 'Creditar Moedas'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
