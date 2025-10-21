"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/StarRating"
import { Star, MessageSquare } from "lucide-react"

interface AvaliacaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  solicitacaoId: string
  profissionalId: string
  profissionalNome: string
  clienteId: string
  onAvaliacaoEnviada?: () => void
}

export function AvaliacaoModal({
  open,
  onOpenChange,
  solicitacaoId,
  profissionalId,
  profissionalNome,
  clienteId,
  onAvaliacaoEnviada
}: AvaliacaoModalProps) {
  const [nota, setNota] = useState(0)
  const [comentario, setComentario] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (nota === 0) {
      setError("Por favor, selecione uma nota")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/avaliacoes/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitacao_id: solicitacaoId,
          cliente_id: clienteId,
          profissional_id: profissionalId,
          nota,
          comentario: comentario.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao enviar avaliação')
        setLoading(false)
        return
      }

      // Resetar form
      setNota(0)
      setComentario("")
      setLoading(false)

      // Callback de sucesso
      if (onAvaliacaoEnviada) {
        onAvaliacaoEnviada()
      }

      // Fechar modal
      onOpenChange(false)

    } catch (err) {
      console.error('Erro ao enviar avaliação:', err)
      setError('Erro ao conectar com o servidor')
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setNota(0)
      setComentario("")
      setError("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Star className="text-yellow-400 fill-yellow-400" size={28} />
            Avaliar Profissional
          </DialogTitle>
          <DialogDescription>
            Como foi sua experiência com <span className="font-semibold">{profissionalNome}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Sua avaliação *
            </label>
            <div className="flex justify-center py-2">
              <StarRating
                rating={nota}
                onRatingChange={setNota}
                size={40}
              />
            </div>
            {nota > 0 && (
              <p className="text-center text-sm text-gray-600">
                {nota === 5 && "Excelente! ⭐"}
                {nota === 4 && "Muito bom! 👍"}
                {nota === 3 && "Bom 😊"}
                {nota === 2 && "Regular 😐"}
                {nota === 1 && "Ruim 😞"}
              </p>
            )}
          </div>

          {/* Comentário */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MessageSquare size={16} />
              Comentário (opcional)
            </label>
            <Textarea
              placeholder="Conte como foi sua experiência com este profissional..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {comentario.length}/500 caracteres
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
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
            disabled={loading || nota === 0}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
