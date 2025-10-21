import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// API TEMPORÁRIA APENAS PARA TESTES - REMOVER EM PRODUÇÃO
export async function POST(request: NextRequest) {
  try {
    const { profissional_id, quantidade } = await request.json()

    if (!profissional_id || !quantidade) {
      return NextResponse.json(
        { error: 'profissional_id e quantidade são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar saldo atual
    const { data: profissional, error: errorProf } = await supabase
      .from('profissionais')
      .select('saldo_moedas')
      .eq('id', profissional_id)
      .single()

    if (errorProf || !profissional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    const novoSaldo = (profissional.saldo_moedas || 0) + quantidade

    // Atualizar saldo
    const { error: errorUpdate } = await supabase
      .from('profissionais')
      .update({ saldo_moedas: novoSaldo })
      .eq('id', profissional_id)

    if (errorUpdate) {
      console.error('Erro ao atualizar saldo:', errorUpdate)
      return NextResponse.json(
        { error: 'Erro ao atualizar saldo' },
        { status: 500 }
      )
    }

    // Registrar transação
    await supabase.from('transacoes_moedas').insert({
      profissional_id,
      tipo: 'compra',
      quantidade: quantidade,
      descricao: `Moedas de teste adicionadas`,
      saldo_anterior: profissional.saldo_moedas,
      saldo_novo: novoSaldo,
      payment_id: 'TESTE',
      payment_status: 'approved',
    })

    return NextResponse.json({
      message: 'Moedas adicionadas com sucesso!',
      saldo_anterior: profissional.saldo_moedas,
      novo_saldo: novoSaldo
    })

  } catch (error) {
    console.error('Erro ao adicionar moedas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
