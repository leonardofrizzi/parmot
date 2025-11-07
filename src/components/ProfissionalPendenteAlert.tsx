"use client"

import { AlertCircle, Clock } from "lucide-react"

export function ProfissionalPendenteAlert() {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-start gap-3">
        <Clock className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800 mb-1">
            Conta Pendente de Aprovação
          </h3>
          <p className="text-sm text-yellow-700">
            Sua conta está sendo analisada pela nossa equipe. Você poderá visualizar solicitações,
            comprar moedas e responder aos clientes assim que sua conta for aprovada.
            Isso geralmente leva até 24 horas.
          </p>
        </div>
      </div>
    </div>
  )
}
