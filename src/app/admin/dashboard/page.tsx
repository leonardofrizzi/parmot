"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Shield, LogOut, DollarSign, CheckCircle, XCircle, Clock, User, Mail, Phone, Calendar, Link as LinkIcon, FileText } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [reembolsos, setReembolsos] = useState<any[]>([])
  const [estatisticas, setEstatisticas] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState("pendente")

  const [showAnaliseDialog, setShowAnaliseDialog] = useState(false)
  const [reembolsoSelecionado, setReembolsoSelecionado] = useState<any>(null)
  const [respostaAdmin, setRespostaAdmin] = useState("")
  const [loadingAnalise, setLoadingAnalise] = useState(false)

  useEffect(() => {
    // Verificar se está logado
    const adminData = localStorage.getItem('admin')
    if (!adminData) {
      router.push('/admin/login')
      return
    }

    setAdmin(JSON.parse(adminData))
    fetchReembolsos()
  }, [filtroStatus])

  const fetchReembolsos = async () => {
    try {
      const response = await fetch(`/api/admin/reembolsos/listar?status=${filtroStatus}`)
      const data = await response.json()

      if (response.ok) {
        setReembolsos(data.reembolsos)
        setEstatisticas(data.estatisticas)
      }
      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar reembolsos:', err)
      setLoading(false)
    }
  }

  const handleAbrirAnalise = (reembolso: any) => {
    setReembolsoSelecionado(reembolso)
    setRespostaAdmin("")
    setShowAnaliseDialog(true)
  }

  const handleAnalisar = async (status: 'aprovado' | 'negado') => {
    if (!reembolsoSelecionado || !admin) return

    setLoadingAnalise(true)

    try {
      const response = await fetch('/api/admin/reembolsos/analisar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reembolso_id: reembolsoSelecionado.id,
          admin_id: admin.id,
          status,
          resposta_admin: respostaAdmin.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert('Erro: ' + data.error)
        setLoadingAnalise(false)
        return
      }

      alert(data.message)
      setShowAnaliseDialog(false)
      setLoadingAnalise(false)
      fetchReembolsos() // Recarregar lista

    } catch (err) {
      console.error('Erro ao analisar:', err)
      alert('Erro ao conectar com o servidor')
      setLoadingAnalise(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin')
    router.push('/admin/login')
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

  if (!admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-sm text-gray-300">Bem-vindo, {admin.nome}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-white text-white hover:bg-white/10"
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-600">{estatisticas.pendentes || 0}</p>
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
                  <p className="text-sm font-medium text-gray-600">Aprovados</p>
                  <p className="text-3xl font-bold text-green-600">{estatisticas.aprovados || 0}</p>
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
                  <p className="text-sm font-medium text-gray-600">Negados</p>
                  <p className="text-3xl font-bold text-red-600">{estatisticas.negados || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="text-red-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{estatisticas.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <DollarSign className="text-gray-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Solicitações de Reembolso</CardTitle>
            <CardDescription>Gerencie as solicitações de reembolso dos profissionais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filtroStatus === 'pendente' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('pendente')}
              >
                Pendentes
              </Button>
              <Button
                size="sm"
                variant={filtroStatus === 'aprovado' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('aprovado')}
              >
                Aprovados
              </Button>
              <Button
                size="sm"
                variant={filtroStatus === 'negado' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('negado')}
              >
                Negados
              </Button>
              <Button
                size="sm"
                variant={filtroStatus === 'todos' ? 'default' : 'outline'}
                onClick={() => setFiltroStatus('todos')}
              >
                Todos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Reembolsos */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reembolsos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-600">Nenhuma solicitação de reembolso encontrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reembolsos.map((reembolso) => (
              <Card key={reembolso.id} className="border-l-4" style={{
                borderLeftColor:
                  reembolso.status === 'pendente' ? '#eab308' :
                  reembolso.status === 'aprovado' ? '#16a34a' : '#dc2626'
              }}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Coluna 1: Info do Profissional e Solicitação */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <DollarSign size={20} className="text-orange-600" />
                          {reembolso.moedas_gastas} moedas
                          <Badge variant={reembolso.tipo_contato === 'exclusivo' ? 'default' : 'secondary'}>
                            {reembolso.tipo_contato}
                          </Badge>
                        </h3>
                        <p className="text-sm text-gray-600">{reembolso.categoria_nome}</p>
                        <p className="text-sm font-medium">{reembolso.solicitacao_titulo}</p>
                      </div>

                      <div className="text-sm space-y-1">
                        <p className="flex items-center gap-2">
                          <User size={14} />
                          <strong>Profissional:</strong> {reembolso.profissional_nome}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail size={14} />
                          {reembolso.profissional_email}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={14} />
                          {reembolso.profissional_telefone}
                        </p>
                      </div>

                      <div className="text-sm text-gray-500">
                        <p className="flex items-center gap-2">
                          <Calendar size={14} />
                          {formatData(reembolso.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Coluna 2: Motivo e Provas */}
                    <div className="space-y-3 col-span-2">
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <FileText size={16} />
                          Motivo:
                        </h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                          {reembolso.motivo}
                        </p>
                      </div>

                      {reembolso.provas_urls && reembolso.provas_urls.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <LinkIcon size={16} />
                            Provas ({reembolso.provas_urls.length}):
                          </h4>
                          <div className="space-y-1">
                            {reembolso.provas_urls.map((url: string, index: number) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline block truncate"
                              >
                                {url}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {reembolso.status === 'pendente' && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleAbrirAnalise(reembolso)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Analisar Solicitação
                          </Button>
                        </div>
                      )}

                      {reembolso.status !== 'pendente' && (
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm">
                            <strong>Status:</strong>{" "}
                            <span className={
                              reembolso.status === 'aprovado' ? 'text-green-600' : 'text-red-600'
                            }>
                              {reembolso.status === 'aprovado' ? 'APROVADO' : 'NEGADO'}
                            </span>
                            {" em " + formatData(reembolso.analisado_em)}
                          </p>
                          {reembolso.resposta_admin && (
                            <p className="text-sm mt-2">
                              <strong>Resposta:</strong> {reembolso.resposta_admin}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Análise */}
        <Dialog open={showAnaliseDialog} onOpenChange={setShowAnaliseDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Analisar Solicitação de Reembolso</DialogTitle>
              <DialogDescription>
                {reembolsoSelecionado?.moedas_gastas} moedas - {reembolsoSelecionado?.profissional_nome}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Resposta ao profissional (opcional)</Label>
                <Textarea
                  placeholder="Adicione uma mensagem explicando sua decisão..."
                  value={respostaAdmin}
                  onChange={(e) => setRespostaAdmin(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                <strong>Atenção:</strong> Ao aprovar, {reembolsoSelecionado?.moedas_gastas} moedas serão devolvidas automaticamente ao profissional.
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAnaliseDialog(false)}
                disabled={loadingAnalise}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAnalisar('negado')}
                disabled={loadingAnalise}
              >
                Negar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleAnalisar('aprovado')}
                disabled={loadingAnalise}
              >
                {loadingAnalise ? 'Processando...' : 'Aprovar e Devolver Moedas'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
