import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { supabase } from '@/lib/supabase'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Mercado Pago envia notificações de diferentes tipos
    // Vamos processar apenas notificações de pagamento
    if (body.type === 'payment') {
      const paymentId = body.data.id

      // Buscar informações do pagamento
      const payment = new Payment(client)
      const paymentInfo = await payment.get({ id: paymentId })

      console.log('Payment Info:', paymentInfo)

      // Verificar se o pagamento foi aprovado
      if (paymentInfo.status === 'approved') {
        // Extrair dados do external_reference
        const externalReference = JSON.parse(paymentInfo.external_reference || '{}')
        const { profissional_id, quantidade_moedas, plano_id } = externalReference

        if (profissional_id && quantidade_moedas) {
          // Atualizar saldo do profissional
          const { data: profissional, error: errorProf } = await supabase
            .from('profissionais')
            .select('saldo_moedas')
            .eq('id', profissional_id)
            .single()

          if (errorProf) {
            console.error('Erro ao buscar profissional:', errorProf)
            return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 })
          }

          const novoSaldo = (profissional.saldo_moedas || 0) + quantidade_moedas

          // Atualizar saldo
          const { error: errorUpdate } = await supabase
            .from('profissionais')
            .update({ saldo_moedas: novoSaldo })
            .eq('id', profissional_id)

          if (errorUpdate) {
            console.error('Erro ao atualizar saldo:', errorUpdate)
            return NextResponse.json({ error: 'Erro ao atualizar saldo' }, { status: 500 })
          }

          // Registrar transação
          await supabase.from('transacoes_moedas').insert({
            profissional_id,
            tipo: 'compra',
            quantidade: quantidade_moedas,
            descricao: `Compra de ${quantidade_moedas} moedas - ${plano_id}`,
            saldo_anterior: profissional.saldo_moedas,
            saldo_novo: novoSaldo,
            payment_id: paymentId.toString(),
            payment_status: paymentInfo.status,
          })

          console.log(`Moedas creditadas: ${quantidade_moedas} para profissional ${profissional_id}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar notificação' },
      { status: 500 }
    )
  }
}

// Mercado Pago também envia GET para validar a URL
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok' })
}
