"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Check, Sparkles, TrendingUp, Shield, Zap, ArrowRight, Star } from "lucide-react"

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

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      setProfissional(JSON.parse(usuarioData))
    }
  }, [])

  const planos: PlanoMoedas[] = [
    {
      id: "pacote_bronze",
      nome: "Pacote Bronze",
      moedas: 50,
      preco: 29.90,
      vantagens: [
        "50 moedas",
        "Até 10 contatos padrão",
        "Ou 2 contatos exclusivos",
        "Validade de 90 dias"
      ]
    },
    {
      id: "pacote_prata",
      nome: "Pacote Prata",
      moedas: 150,
      preco: 79.90,
      precoOriginal: 89.70,
      desconto: "-11%",
      recomendado: true,
      vantagens: [
        "150 moedas (bônus +20)",
        "Até 30 contatos padrão",
        "Ou 7 contatos exclusivos",
        "Validade de 180 dias",
        "Suporte prioritário"
      ]
    },
    {
      id: "pacote_ouro",
      nome: "Pacote Ouro",
      moedas: 350,
      preco: 169.90,
      precoOriginal: 209.30,
      desconto: "-19%",
      vantagens: [
        "350 moedas (bônus +70)",
        "Até 70 contatos padrão",
        "Ou 17 contatos exclusivos",
        "Validade de 1 ano",
        "Suporte VIP 24/7",
        "Acesso antecipado"
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
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
                <Coins size={18} />
                <span className="font-semibold">Saldo atual: {profissional.saldo_moedas} moedas</span>
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
                    disabled={loading}
                    variant={plano.recomendado ? "default" : "outline"}
                  >
                    {loading && planoSelecionado === plano.id ? (
                      "Processando..."
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
                    <h3 className="font-semibold text-gray-900 mb-1">Contato Padrão - 5 moedas</h3>
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
                    <h3 className="font-semibold text-gray-900 mb-1">Exclusividade - 20 moedas</h3>
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
                    <h3 className="font-semibold text-gray-900 mb-1">Mais moedas, mais economia</h3>
                    <p className="text-sm text-gray-600">
                      Pacotes maiores possuem moedas bônus e melhor custo-benefício.
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
                  Sim, cada pacote tem uma validade específica. Pacote Bronze: 90 dias, Prata: 180 dias, Ouro: 1 ano.
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
