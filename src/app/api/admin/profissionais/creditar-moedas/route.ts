import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { profissional_id, quantidade, motivo, admin_id } = await request.json()

    // Validações
    if (!profissional_id || !quantidade || !admin_id) {
      return NextResponse.json(
        { error: 'Dados incompletos. Informe profissional_id, quantidade e admin_id.' },
        { status: 400 }
      )
    }

    if (quantidade <= 0) {
      return NextResponse.json(
        { error: 'A quantidade deve ser maior que zero.' },
        { status: 400 }
      )
    }

    // Buscar profissional
    const { data: profissional, error: profError } = await supabaseAdmin
      .from('profissionais')
      .select('id, nome, saldo_moedas')
      .eq('id', profissional_id)
      .single()

    if (profError || !profissional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado.' },
        { status: 404 }
      )
    }

    const saldoAnterior = profissional.saldo_moedas || 0
    const novoSaldo = saldoAnterior + quantidade

    // Atualizar saldo do profissional
    const { error: updateError } = await supabaseAdmin
      .from('profissionais')
      .update({ saldo_moedas: novoSaldo })
      .eq('id', profissional_id)

    if (updateError) {
      console.error('Erro ao atualizar saldo:', updateError)
      return NextResponse.json(
        { error: 'Erro ao creditar moedas.' },
        { status: 500 }
      )
    }

    // Registrar transação
    await supabaseAdmin.from('transacoes_moedas').insert({
      profissional_id,
      tipo: 'credito_admin',
      quantidade,
      descricao: motivo || 'Crédito manual pelo administrador',
      saldo_anterior: saldoAnterior,
      saldo_novo: novoSaldo,
      payment_id: `ADMIN-CREDIT-${Date.now()}`,
      payment_status: 'approved'
    })

    return NextResponse.json({
      message: `${quantidade} moedas creditadas com sucesso para ${profissional.nome}!`,
      saldo_anterior: saldoAnterior,
      saldo_novo: novoSaldo
    })

  } catch (error) {
    console.error('Erro ao creditar moedas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}
