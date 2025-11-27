"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Users, Briefcase, Mail, Phone, MapPin, Ban, ShieldOff, Search, CheckCircle2 } from "lucide-react"

interface Usuario {
  id: string
  nome: string
  email: string
  telefone: string
  cidade?: string
  estado?: string
  tipo_usuario: 'cliente' | 'profissional'
  aprovado?: boolean
  banido?: boolean
  banido_em?: string
  motivo_banimento?: string
  created_at: string
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState<'todos' | 'clientes' | 'profissionais'>('todos')
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'banidos'>('ativos')
  const [busca, setBusca] = useState('')
  const [showDialogBanir, setShowDialogBanir] = useState(false)
  const [motivoBanimento, setMotivoBanimento] = useState('')
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)
  const [loadingAcao, setLoadingAcao] = useState(false)

  useEffect(() => {
    fetchUsuarios()
  }, [tipo, filtro])

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('tipo', tipo)
      params.set('filtro', filtro)
      if (busca) params.set('busca', busca)

      const response = await fetch(`/api/admin/usuarios?${params}`)
      const data = await response.json()

      if (response.ok) {
        setUsuarios(data.usuarios)
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = () => {
    fetchUsuarios()
  }

  const handleBanir = async (banir: boolean) => {
    if (!usuarioSelecionado) return

    setLoadingAcao(true)
    try {
      const response = await fetch('/api/admin/usuarios/banir', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuarioSelecionado.id,
          tipo_usuario: usuarioSelecionado.tipo_usuario,
          banido: banir,
          motivo: motivoBanimento || 'Comportamento inadequado'
        })
      })

      if (response.ok) {
        fetchUsuarios()
        setShowDialogBanir(false)
        setUsuarioSelecionado(null)
        setMotivoBanimento('')
      }
    } catch (err) {
      console.error('Erro ao banir usuário:', err)
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-9 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-600">Visualize e gerencie clientes e profissionais da plataforma</p>
        </div>

        {/* Filtros */}
        <div className="mb-6 space-y-4">
          {/* Tipo de usuário */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={tipo === 'todos' ? 'default' : 'outline'}
              onClick={() => setTipo('todos')}
            >
              <Users size={16} className="mr-1" />
              Todos
            </Button>
            <Button
              variant={tipo === 'clientes' ? 'default' : 'outline'}
              onClick={() => setTipo('clientes')}
            >
              <User size={16} className="mr-1" />
              Clientes
            </Button>
            <Button
              variant={tipo === 'profissionais' ? 'default' : 'outline'}
              onClick={() => setTipo('profissionais')}
            >
              <Briefcase size={16} className="mr-1" />
              Profissionais
            </Button>
          </div>

          {/* Status */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={filtro === 'ativos' ? 'default' : 'outline'}
              onClick={() => setFiltro('ativos')}
            >
              Ativos
            </Button>
            <Button
              size="sm"
              variant={filtro === 'banidos' ? 'default' : 'outline'}
              onClick={() => setFiltro('banidos')}
              className={filtro === 'banidos' ? 'bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-700 hover:bg-red-50'}
            >
              <Ban size={14} className="mr-1" />
              Banidos
            </Button>
            <Button
              size="sm"
              variant={filtro === 'todos' ? 'default' : 'outline'}
              onClick={() => setFiltro('todos')}
            >
              Todos
            </Button>
          </div>

          {/* Busca */}
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              className="max-w-md"
            />
            <Button onClick={handleBuscar} variant="outline">
              <Search size={16} className="mr-1" />
              Buscar
            </Button>
          </div>
        </div>

        {/* Contador */}
        <div className="mb-4 text-sm text-gray-600">
          {usuarios.length} usuário(s) encontrado(s)
        </div>

        {/* Lista de Usuários */}
        {usuarios.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou termo de busca.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usuarios.map((usuario) => (
              <Card key={`${usuario.tipo_usuario}-${usuario.id}`} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {usuario.tipo_usuario === 'cliente' ? (
                        <User size={18} className="text-blue-600" />
                      ) : (
                        <Briefcase size={18} className="text-green-600" />
                      )}
                      <CardTitle className="text-lg">{usuario.nome}</CardTitle>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="outline" className={usuario.tipo_usuario === 'cliente' ? 'border-blue-300 text-blue-700' : 'border-green-300 text-green-700'}>
                        {usuario.tipo_usuario === 'cliente' ? 'Cliente' : 'Profissional'}
                      </Badge>
                      {usuario.banido ? (
                        <Badge className="bg-red-100 text-red-700 border-red-300">
                          <Ban size={12} className="mr-1" />
                          Banido
                        </Badge>
                      ) : usuario.tipo_usuario === 'profissional' && usuario.aprovado && (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          <CheckCircle2 size={12} className="mr-1" />
                          Aprovado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} />
                      <span className="truncate">{usuario.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} />
                      <span>{usuario.telefone || 'Não informado'}</span>
                    </div>
                    {(usuario.cidade || usuario.estado) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={14} />
                        <span>{usuario.cidade}{usuario.cidade && usuario.estado && ', '}{usuario.estado}</span>
                      </div>
                    )}
                  </div>

                  {/* Informações de banimento */}
                  {usuario.banido && usuario.motivo_banimento && (
                    <div className="bg-red-50 rounded-md p-2 text-sm">
                      <p className="text-red-700">
                        <strong>Motivo:</strong> {usuario.motivo_banimento}
                      </p>
                      {usuario.banido_em && (
                        <p className="text-red-600 text-xs mt-1">
                          Banido em: {formatData(usuario.banido_em)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="pt-3">
                    {usuario.banido ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => {
                          setUsuarioSelecionado(usuario)
                          setShowDialogBanir(true)
                        }}
                      >
                        <ShieldOff size={16} className="mr-1" />
                        Remover Banimento
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setUsuarioSelecionado(usuario)
                          setShowDialogBanir(true)
                        }}
                      >
                        <Ban size={16} className="mr-1" />
                        Banir Usuário
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Cadastrado em {formatData(usuario.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Confirmação - Banir */}
        <Dialog open={showDialogBanir} onOpenChange={(open) => {
          setShowDialogBanir(open)
          if (!open) setMotivoBanimento('')
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {usuarioSelecionado?.banido ? 'Remover Banimento' : 'Banir Usuário'}
              </DialogTitle>
              <DialogDescription>
                {usuarioSelecionado?.banido ? (
                  <>
                    Tem certeza que deseja remover o banimento de <strong>{usuarioSelecionado?.nome}</strong>?
                    {usuarioSelecionado?.tipo_usuario === 'profissional' && ' O profissional precisará ser aprovado novamente.'}
                  </>
                ) : (
                  <>
                    Tem certeza que deseja banir <strong>{usuarioSelecionado?.nome}</strong> ({usuarioSelecionado?.tipo_usuario})?
                    O usuário não poderá mais acessar a plataforma.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {!usuarioSelecionado?.banido && (
              <div className="py-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Motivo do banimento (opcional)
                </label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm"
                  rows={3}
                  placeholder="Ex: Comportamento inadequado, fraude, spam..."
                  value={motivoBanimento}
                  onChange={(e) => setMotivoBanimento(e.target.value)}
                />
              </div>
            )}

            {usuarioSelecionado?.banido && usuarioSelecionado?.motivo_banimento && (
              <div className="py-4 bg-red-50 rounded-md p-3">
                <p className="text-sm text-gray-700">
                  <strong>Motivo do banimento:</strong> {usuarioSelecionado.motivo_banimento}
                </p>
                {usuarioSelecionado.banido_em && (
                  <p className="text-xs text-gray-500 mt-1">
                    Banido em: {formatData(usuarioSelecionado.banido_em)}
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
                variant={usuarioSelecionado?.banido ? 'default' : 'destructive'}
                onClick={() => handleBanir(!usuarioSelecionado?.banido)}
                disabled={loadingAcao}
              >
                {loadingAcao
                  ? (usuarioSelecionado?.banido ? 'Removendo...' : 'Banindo...')
                  : (usuarioSelecionado?.banido ? 'Remover Banimento' : 'Confirmar Banimento')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
