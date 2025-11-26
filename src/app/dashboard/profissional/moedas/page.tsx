"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Coins, Check, Sparkles, TrendingUp, Shield, Zap, ArrowRight, Star, CheckCircle2 } from "lucide-react"

interface PlanoMoedas {
  id: string
  nome: string
  moedas: number
  preco: number
  precoOriginal?: number
  desconto?: string
  recomendado?: boolean
  vantagens: string[]
}

export default function ComprarMoedas() {
  const router = useRouter()
  const [profissional, setProfissional] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      setProfissional(JSON.parse(usuarioData))
    }
  }, [])

  const adicionarMoedasTeste = async () => {
    if (!profissional) return

    try {
      const response = await fetch('/api/profissional/adicionar-moedas-teste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profissional_id: profissional.id,
          quantidade: 100
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Atualizar localStorage
        const updatedUser = { ...profissional, saldo_moedas: data.novo_saldo }
        localStorage.setItem('usuario', JSON.stringify(updatedUser))
        setProfissional(updatedUser)

        // Mostrar dialog de sucesso
        setSuccessData(data)
        setShowSuccessDialog(true)
      } else {
        alert('Erro ao adicionar moedas: ' + data.error)
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor')
    }
  }

  const planos: PlanoMoedas[] = [
    {
      id: "pacote_inicial",
      nome: "Pacote Inicial",
      moedas: 30,
      preco: 29.90,
      vantagens: [
        "30 moedas",
        "Até 2 contatos padrão",
        "Moedas nunca expiram",
        "Ideal para começar"
      ]
    },
    {
      id: "pacote_profissional",
      nome: "Pacote Profissional",
      moedas: 80,
      preco: 69.90,
      precoOriginal: 79.90,
      desconto: "-12%",
      recomendado: true,
      vantagens: [
        "80 moedas",
        "Até 5 contatos padrão",
        "Ou 1 contato exclusivo",
        "Moedas nunca expiram",
        "Melhor custo-benefício"
      ]
    },
    {
      id: "pacote_premium",
      nome: "Pacote Premium",
      moedas: 200,
      preco: 149.90,
      precoOriginal: 199.90,
      desconto: "-25%",
      vantagens: [
        "200 moedas",
        "Até 13 contatos padrão",
        "Ou 4 contatos exclusivos",
        "Moedas nunca expiram",
        "Suporte prioritário"
      ]
    }
  ]

  const handleComprar = async (planoId: string) => {
    setLoading(true)
    setPlanoSelecionado(planoId)

    try {
      const plano = planos.find(p => p.id === planoId)

      // Criar preferência de pagamento no Mercado Pago
      const response = await fetch('/api/mercadopago/criar-preferencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profissional_id: profissional.id,
          plano_id: planoId,
          titulo: plano?.nome,
          quantidade_moedas: plano?.moedas,
          preco: plano?.preco
        })
      })

      const data = await response.json()

      if (response.ok && data.init_point) {
        // Redirecionar para o checkout do Mercado Pago
        window.location.href = data.init_point
      } else {
        alert('Erro ao processar pagamento. Tente novamente.')
        setLoading(false)
        setPlanoSelecionado(null)
      }
    } catch (error) {
      console.error('Erro ao criar preferência:', error)
      alert('Erro ao conectar com o servidor. Tente novamente.')
      setLoading(false)
      setPlanoSelecionado(null)
    }
  }

  if (!profissional) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="text-center mb-12">
              <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
              <Skeleton className="h-10 w-64 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto mb-4" />
              <Skeleton className="h-10 w-48 mx-auto rounded-full" />
            </div>

            {/* Plans Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-10 w-24 mb-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              <Coins size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Comprar Moedas
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Adquira moedas e tenha acesso a contatos de clientes que precisam dos seus serviços
            </p>
            {profissional && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
                  <Coins size={18} />
                  <span className="font-semibold">Saldo atual: {profissional.saldo_moedas} moedas</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={adicionarMoedasTeste}
                  className="text-xs"
                  title="Apenas para testes - adiciona 100 moedas"
                  disabled={profissional && !profissional.aprovado}
                >
                  + 100 moedas (teste)
                </Button>
              </div>
            )}
          </div>

          {/* Planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {planos.map((plano) => (
              <Card
                key={plano.id}
                className={`relative hover:shadow-2xl transition-all duration-300 ${
                  plano.recomendado ? 'border-2 border-primary-500 scale-105' : 'hover:scale-105'
                }`}
              >
                {plano.recomendado && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-bold rounded-full shadow-lg">
                      <Star size={14} fill="white" />
                      MAIS POPULAR
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl mb-2">{plano.nome}</CardTitle>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Coins size={24} className="text-yellow-500" />
                    <span className="text-4xl font-bold text-gray-900">{plano.moedas}</span>
                    <span className="text-gray-600">moedas</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {plano.precoOriginal && (
                      <span className="text-gray-400 line-through">
                        R$ {plano.precoOriginal.toFixed(2)}
                      </span>
                    )}
                    <span className="text-3xl font-bold text-primary-600">
                      R$ {plano.preco.toFixed(2)}
                    </span>
                  </div>
                  {plano.desconto && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      {plano.desconto} de desconto
                    </span>
                  )}
                  <CardDescription className="text-xs mt-2">
                    R$ {(plano.preco / plano.moedas).toFixed(2)} por moeda
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plano.vantagens.map((vantagem, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{vantagem}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleComprar(plano.id)}
                    disabled={loading || (profissional && !profissional.aprovado)}
                    variant={plano.recomendado ? "default" : "outline"}
                    title={profissional && !profissional.aprovado ? "Aguardando aprovação da sua conta" : ""}
                  >
                    {loading && planoSelecionado === plano.id ? (
                      "Processando..."
                    ) : profissional && !profissional.aprovado ? (
                      "Conta pendente de aprovação"
                    ) : (
                      <>
                        Comprar agora
                        <ArrowRight size={18} className="ml-2" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Como Funciona */}
          <Card className="mb-8 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="text-primary-600" />
                Como funcionam as moedas?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Coins className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Contato Padrão - 15 moedas</h3>
                    <p className="text-sm text-gray-600">
                      Acesse o contato do cliente. Até 4 profissionais podem liberar o mesmo contato.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Exclusividade - 50 moedas</h3>
                    <p className="text-sm text-gray-600">
                      Seja o único profissional com acesso ao contato. Nenhum outro profissional poderá liberar.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-green-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Moedas não expiram</h3>
                    <p className="text-sm text-gray-600">
                      Suas moedas nunca vencem. Use quando quiser, sem prazo de validade.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Sem mensalidade</h3>
                    <p className="text-sm text-gray-600">
                      Você só paga pelos contatos que liberar. Sem taxas fixas ou surpresas.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vantagens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center border-2 border-transparent hover:border-primary-200 transition-all">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={32} className="text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Pagamento Seguro</h3>
                <p className="text-sm text-gray-600">
                  Processamento via Mercado Pago com total segurança e proteção de dados
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-transparent hover:border-primary-200 transition-all">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={32} className="text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Crédito Instantâneo</h3>
                <p className="text-sm text-gray-600">
                  Suas moedas são creditadas imediatamente após a aprovação do pagamento
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-transparent hover:border-primary-200 transition-all">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={32} className="text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Retorno Garantido</h3>
                <p className="text-sm text-gray-600">
                  Profissionais aumentam em média 3x seu faturamento usando nossa plataforma
                </p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ ou Dúvidas */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Dúvidas Frequentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">As moedas têm validade?</h4>
                <p className="text-sm text-gray-600">
                  Não! Suas moedas nunca expiram. Use quando quiser, sem pressa.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Posso pedir reembolso?</h4>
                <p className="text-sm text-gray-600">
                  Sim! Se você usar o contato exclusivo e o cliente não responder em 7 dias, devolveremos suas moedas.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Quais formas de pagamento são aceitas?</h4>
                <p className="text-sm text-gray-600">
                  Aceitamos cartão de crédito, débito, PIX e boleto bancário via Mercado Pago.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Qual a diferença entre contato padrão e exclusivo?</h4>
                <p className="text-sm text-gray-600">
                  No padrão (15 moedas), até 4 profissionais podem ver o contato. No exclusivo (50 moedas), só você tem acesso.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Sucesso */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl">Moedas Adicionadas!</DialogTitle>
            <DialogDescription className="text-center">
              {successData?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Saldo anterior:</span>
                <span className="font-semibold">{successData?.saldo_anterior} moedas</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Moedas adicionadas:</span>
                <span className="font-semibold text-green-600">+100 moedas</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Novo saldo:</span>
                <span className="font-bold text-primary-600 text-lg">{successData?.novo_saldo} moedas</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => window.location.reload()} className="w-full">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
