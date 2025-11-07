"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, CheckCircle2, XCircle, Clock, User, Calendar, Link as LinkIcon, FileText } from "lucide-react"

export default function AdminReembolsos() {
  const [reembolsos, setReembolsos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState("pendente")
  const [showAnaliseDialog, setShowAnaliseDialog] = useState(false)
  const [reembolsoSelecionado, setReembolsoSelecionado] = useState<any>(null)
  const [respostaAdmin, setRespostaAdmin] = useState("")
  const [loadingAnalise, setLoadingAnalise] = useState(false)

  useEffect(() => {
    fetchReembolsos()
  }, [filtroStatus])

  const fetchReembolsos = async () => {
    try {
      const response = await fetch("/api/admin/reembolsos/listar?status=" + filtroStatus)
      const data = await response.json()
      if (response.ok) {
        setReembolsos(data.reembolsos || [])
      }
      setLoading(false)
    } catch (err) {
      console.error("Erro:", err)
      setLoading(false)
    }
  }

  const handleAnalisar = async (status: "aprovado" | "negado") => {
    if (!reembolsoSelecionado) return
    setLoadingAnalise(true)
    try {
      const adminData = localStorage.getItem("admin")
      const admin = adminData ? JSON.parse(adminData) : null
      const response = await fetch("/api/admin/reembolsos/analisar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reembolso_id: reembolsoSelecionado.id,
          admin_id: admin?.id,
          status,
          resposta_admin: respostaAdmin.trim() || null
        })
      })
      if (response.ok) {
        setShowAnaliseDialog(false)
        fetchReembolsos()
      }
    } catch (err) {
      console.error("Erro:", err)
    }
    setLoadingAnalise(false)
  }

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const stats = {
    pendentes: reembolsos.filter(r => r.status === "pendente").length,
    aprovados: reembolsos.filter(r => r.status === "aprovado").length,
    negados: reembolsos.filter(r => r.status === "negado").length,
    total: reembolsos.length
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-9 w-64 mb-8" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitações de Reembolso</h1>
        <p className="text-gray-600 mb-8">Analise e gerencie pedidos de reembolso dos profissionais</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
              <p className="text-sm text-gray-600">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
              <p className="text-sm text-gray-600">Aprovados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.negados}</div>
              <p className="text-sm text-gray-600">Negados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
        </div>
        <div className="flex gap-2 mb-6">
          <Button variant={filtroStatus === "pendente" ? "default" : "outline"} onClick={() => setFiltroStatus("pendente")}>
            Pendentes
          </Button>
          <Button variant={filtroStatus === "aprovado" ? "default" : "outline"} onClick={() => setFiltroStatus("aprovado")}>
            Aprovados
          </Button>
          <Button variant={filtroStatus === "negado" ? "default" : "outline"} onClick={() => setFiltroStatus("negado")}>
            Negados
          </Button>
          <Button variant={filtroStatus === "todos" ? "default" : "outline"} onClick={() => setFiltroStatus("todos")}>
            Todos
          </Button>
        </div>
        {reembolsos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum reembolso encontrado</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reembolsos.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-2">{r.solicitacao_titulo}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span><Calendar size={14} className="inline mr-1" />{formatData(r.created_at)}</span>
                        <span><DollarSign size={14} className="inline mr-1" />{r.moedas_gastas} moedas</span>
                      </div>
                    </div>
                    {r.status === "pendente" && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300"><Clock size={12} className="mr-1" />Pendente</Badge>}
                    {r.status === "aprovado" && <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle2 size={12} className="mr-1" />Aprovado</Badge>}
                    {r.status === "negado" && <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle size={12} className="mr-1" />Negado</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2"><User size={16} className="inline mr-1" />Profissional</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="text-gray-600">Nome:</span> {r.profissional_nome}</div>
                      <div><span className="text-gray-600">Email:</span> {r.profissional_email}</div>
                      <div><span className="text-gray-600">Telefone:</span> {r.profissional_telefone}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2"><FileText size={16} className="inline mr-1" />Motivo</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{r.motivo}</p>
                  </div>
                  {r.provas_urls && r.provas_urls.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2"><LinkIcon size={16} className="inline mr-1" />Provas</h4>
                      {r.provas_urls.map((url: string, idx: number) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">{url}</a>
                      ))}
                    </div>
                  )}
                  {r.status !== "pendente" && r.resposta_admin && (
                    <div className={"p-4 rounded-lg " + (r.status === "aprovado" ? "bg-green-50" : "bg-red-50")}>
                      <h4 className="font-semibold text-gray-900 mb-1">Resposta do Administrador</h4>
                      <p className="text-sm">{r.resposta_admin}</p>
                    </div>
                  )}
                  {r.status === "pendente" && (
                    <Button onClick={() => { setReembolsoSelecionado(r); setRespostaAdmin(""); setShowAnaliseDialog(true) }} className="w-full">
                      Analisar Solicitação
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Dialog open={showAnaliseDialog} onOpenChange={setShowAnaliseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Analisar Reembolso</DialogTitle>
              <DialogDescription>
                Reembolso de {reembolsoSelecionado?.moedas_gastas} moedas para {reembolsoSelecionado?.profissional_nome}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Comentário (opcional)</Label>
                <Textarea value={respostaAdmin} onChange={(e) => setRespostaAdmin(e.target.value)} placeholder="Adicione um comentário..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAnaliseDialog(false)} disabled={loadingAnalise}>Cancelar</Button>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => handleAnalisar("negado")} disabled={loadingAnalise}>Negar</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAnalisar("aprovado")} disabled={loadingAnalise}>{loadingAnalise ? "Processando..." : "Aprovar e Devolver Moedas"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
