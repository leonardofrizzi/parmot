"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign, FileText, Link as LinkIcon, X, CheckCircle2 } from "lucide-react"

interface Atendimento {
  resposta_id: string
  cliente_nome: string
  exclusivo: boolean
}

interface ReembolsoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  atendimento: Atendimento
  profissionalId: string
  onReembolsoSolicitado?: () => void
}

export function ReembolsoModal({
  open,
  onOpenChange,
  atendimento,
  profissionalId,
  onReembolsoSolicitado
}: ReembolsoModalProps) {
  const [motivo, setMotivo] = useState("")
  const [provasUrls, setProvasUrls] = useState<string[]>([])
  const [novaProva, setNovaProva] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSucesso, setShowSucesso] = useState(false)

  const handleAdicionarProva = () => {
    if (novaProva.trim()) {
      setProvasUrls([...provasUrls, novaProva.trim()])
      setNovaProva("")
    }
  }

  const handleRemoverProva = (index: number) => {
    setProvasUrls(provasUrls.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (motivo.trim().length < 20) {
      setError("O motivo deve ter no mínimo 20 caracteres")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/profissional/reembolso/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profissional_id: profissionalId,
          resposta_id: atendimento.resposta_id,
          motivo: motivo.trim(),
          provas_urls: provasUrls
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao solicitar reembolso')
        setLoading(false)
        return
      }

      // Resetar form
      setMotivo("")
      setProvasUrls([])
      setNovaProva("")
      setLoading(false)

      // Fechar modal de reembolso e mostrar sucesso
      onOpenChange(false)
      setShowSucesso(true)

    } catch (err) {
      console.error('Erro ao solicitar reembolso:', err)
      setError('Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setMotivo("")
      setProvasUrls([])
      setNovaProva("")
      setError("")
      onOpenChange(false)
    }
  }

  const moedasGastas = atendimento?.exclusivo ? 20 : 5

  const handleSucessoClose = () => {
    setShowSucesso(false)
    if (onReembolsoSolicitado) {
      onReembolsoSolicitado()
    }
  }

  return (
    <>
      {/* Dialog de Sucesso */}
      <Dialog open={showSucesso} onOpenChange={handleSucessoClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-green-600" size={40} />
              </div>
              <div>
                <DialogTitle className="text-2xl mb-2">
                  Solicitação Enviada com Sucesso!
                </DialogTitle>
                <DialogDescription className="text-base">
                  Sua solicitação de reembolso de <strong>{moedasGastas} moedas</strong> foi enviada e será analisada por um administrador em breve.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📧 Você receberá uma notificação assim que sua solicitação for analisada.
              Acompanhe o status na área de reembolsos.
            </p>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button onClick={handleSucessoClose} className="bg-green-600 hover:bg-green-700">
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Solicitação de Reembolso */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <DollarSign className="text-orange-500" size={28} />
            Solicitar Reembolso
          </DialogTitle>
          <DialogDescription>
            Solicitação de reembolso de <strong>{moedasGastas} moedas</strong> pelo contato com{" "}
            <strong>{atendimento?.cliente_nome}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Motivo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText size={16} />
              Motivo da solicitação *
            </Label>
            <Textarea
              placeholder="Explique detalhadamente por que você está solicitando o reembolso. Ex: Cliente não respondeu após X tentativas de contato por telefone e WhatsApp..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={5}
              maxLength={1000}
              className={`resize-none ${motivo.length > 0 && motivo.length < 20 ? 'border-red-300 focus:border-red-500' : ''}`}
            />
            <p className={`text-xs text-right ${motivo.length > 0 && motivo.length < 20 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              {motivo.length}/1000 caracteres (mínimo 20)
            </p>
          </div>

          {/* Provas */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <LinkIcon size={16} />
              Links de provas (opcional)
            </Label>

            <div className="flex gap-2">
              <Input
                placeholder="https://imgur.com/... ou link do Google Drive"
                value={novaProva}
                onChange={(e) => setNovaProva(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdicionarProva()}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAdicionarProva}
                disabled={!novaProva.trim()}
              >
                Adicionar
              </Button>
            </div>

            {provasUrls.length > 0 && (
              <div className="space-y-2">
                {provasUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <LinkIcon size={14} className="text-gray-400" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex-1 truncate"
                    >
                      {url}
                    </a>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoverProva(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500">
              Screenshots, prints de WhatsApp, etc. Enviar provas aumenta as chances de aprovação.
            </p>
          </div>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Sua solicitação será analisada por um administrador.
              Certifique-se de fornecer informações detalhadas e provas suficientes.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {motivo.length > 0 && motivo.length < 20 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
              ⚠️ O motivo precisa ter pelo menos 20 caracteres. Faltam <strong>{20 - motivo.length}</strong> caracteres.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || motivo.trim().length < 20}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? 'Enviando...' : `Solicitar Reembolso de ${moedasGastas} Moedas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
