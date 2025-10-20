"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react"

export default function PagamentoFalha() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={48} className="text-red-600" />
          </div>
          <CardTitle className="text-3xl text-red-600 mb-2">
            Pagamento Não Aprovado
          </CardTitle>
          <p className="text-gray-600">
            Não foi possível processar seu pagamento
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">O que pode ter acontecido?</h3>
            <ul className="space-y-1 text-sm text-red-800">
              <li>• Saldo insuficiente no cartão</li>
              <li>• Dados do cartão incorretos</li>
              <li>• Cartão bloqueado ou vencido</li>
              <li>• Problemas na conexão durante o pagamento</li>
            </ul>
          </div>

          {paymentId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ID da tentativa:</span>
                <span className="font-mono text-xs">{paymentId}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-center text-gray-600">
              Não se preocupe! Você pode tentar novamente.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => router.push('/dashboard/profissional/moedas')}
                className="w-full"
              >
                <RefreshCw size={18} className="mr-2" />
                Tentar Novamente
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/profissional')}
                className="w-full"
              >
                <ArrowLeft size={18} className="mr-2" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 text-center">
              <strong>Precisa de ajuda?</strong> Entre em contato com nosso suporte pelo email: suporte@parmot.com.br
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
