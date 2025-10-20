"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ArrowLeft, Mail } from "lucide-react"

export default function PagamentoPendente() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const paymentId = searchParams.get('payment_id')
  const paymentType = searchParams.get('payment_type_id')

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={48} className="text-yellow-600" />
          </div>
          <CardTitle className="text-3xl text-yellow-600 mb-2">
            Pagamento Pendente
          </CardTitle>
          <p className="text-gray-600">
            Estamos aguardando a confirmação do pagamento
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">O que significa?</h3>
            <p className="text-sm text-yellow-800 mb-3">
              Seu pedido foi registrado e estamos aguardando a confirmação do pagamento.
            </p>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• <strong>PIX:</strong> Geralmente confirmado em alguns minutos</li>
              <li>• <strong>Boleto:</strong> Pode levar até 3 dias úteis</li>
              <li>• <strong>Cartão:</strong> Processamento em análise</li>
            </ul>
          </div>

          {paymentId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">ID do pagamento:</span>
                <span className="font-mono text-xs">{paymentId}</span>
              </div>
              {paymentType && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Forma de pagamento:</span>
                  <span className="font-semibold">{paymentType}</span>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Fique tranquilo!</h4>
                <p className="text-sm text-blue-800">
                  Assim que o pagamento for confirmado, suas moedas serão creditadas automaticamente e você receberá um email de confirmação.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => router.push('/dashboard/profissional')}
                className="w-full"
              >
                Ir para Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/profissional/moedas')}
                className="w-full"
              >
                <ArrowLeft size={18} className="mr-2" />
                Voltar
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 text-center">
              <strong>Precisa de ajuda?</strong> Entre em contato: <a href="mailto:suporte@parmot.com.br" className="text-primary-600 hover:underline">suporte@parmot.com.br</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
