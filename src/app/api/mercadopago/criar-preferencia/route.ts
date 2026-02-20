import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

// Configurar Mercado Pago com suas credenciais
// IMPORTANTE: Adicione sua ACCESS_TOKEN nas variáveis de ambiente (.env.local)
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profissional_id, plano_id, titulo, quantidade_moedas, preco } = body

    if (!profissional_id || !plano_id || !titulo || !quantidade_moedas || !preco) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Criar instância de Preference
    const preference = new Preference(client)

    // URL base para retornos (usar variável de ambiente em produção)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Criar preferência de pagamento
    const preferenceData = await preference.create({
      body: {
        items: [
          {
            id: plano_id,
            title: `${titulo} - ${quantidade_moedas} moedas`,
            description: `Recarga de ${quantidade_moedas} moedas para a plataforma Parmot Serviços`,
            quantity: 1,
            unit_price: preco,
            currency_id: 'BRL',
          },
        ],
        back_urls: {
          success: `${baseUrl}/dashboard/profissional/moedas/sucesso`,
          failure: `${baseUrl}/dashboard/profissional/moedas/falha`,
          pending: `${baseUrl}/dashboard/profissional/moedas/pendente`,
        },
        notification_url: `${baseUrl}/api/mercadopago/webhook`,
        external_reference: JSON.stringify({
          profissional_id,
          plano_id,
          quantidade_moedas,
        }),
        statement_descriptor: 'PARMOT SERVICOS',
      },
    })

    return NextResponse.json({
      id: preferenceData.id,
      init_point: preferenceData.init_point,
    })
  } catch (error) {
    console.error('Erro ao criar preferência:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}
