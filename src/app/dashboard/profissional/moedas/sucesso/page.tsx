"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Coins, ArrowRight } from "lucide-react"

export default function PagamentoSucesso() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profissional, setProfissional] = useState<any>(null)

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setProfissional(user)

      // Recarregar dados do profissional para atualizar saldo
      fetch(`/api/profissional/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.profissional) {
            // Atualizar localStorage com novo saldo
            const updatedUser = { ...user, saldo_moedas: data.profissional.saldo_moedas }
            localStorage.setItem('usuario', JSON.stringify(updatedUser))
            setProfissional(updatedUser)
          }
        })
        .catch(err => console.error('Erro ao recarregar dados:', err))
    }
  }, [])

  const paymentId = searchParams.get('payment_id')
  const status = searchParams.get('status')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
          <CardTitle className="text-3xl text-green-600 mb-2">
            Pagamento Aprovado!
          </CardTitle>
          <p className="text-gray-600">
            Suas moedas foram creditadas com sucesso
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {profissional && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins size={32} className="text-yellow-600" />
                <span className="text-4xl font-bold text-gray-900">
                  {profissional.saldo_moedas}
                </span>
              </div>
              <p className="text-sm text-gray-600">Seu saldo atual de moedas</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold text-green-600">Aprovado</span>
            </div>
            {paymentId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ID da transação:</span>
                <span className="font-mono text-xs">{paymentId}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-center text-gray-600">
              O que você gostaria de fazer agora?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => router.push('/dashboard/profissional/solicitacoes')}
                className="w-full"
              >
                Buscar Serviços
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/profissional')}
                className="w-full"
              >
                Ir para Dashboard
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 text-center">
              <strong>Dica:</strong> Agora você pode liberar contatos de clientes e começar a atender novos serviços!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
