import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(request: NextRequest) {
  try {
    const {
      reembolso_id,
      admin_id,
      status, // 'aprovado' ou 'negado'
      resposta_admin
    } = await request.json()

    // Validações
    if (!reembolso_id || !admin_id || !status) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (!['aprovado', 'negado'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use "aprovado" ou "negado"' },
        { status: 400 }
      )
    }

    // Buscar dados do reembolso
    const { data: reembolso, error: reembolsoError } = await supabase
      .from('solicitacoes_reembolso')
      .select('*')
      .eq('id', reembolso_id)
      .single()

    if (reembolsoError || !reembolso) {
      return NextResponse.json(
        { error: 'Reembolso não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já foi analisado
    if (reembolso.status !== 'pendente') {
      return NextResponse.json(
        { error: `Este reembolso já foi ${reembolso.status}` },
        { status: 400 }
      )
    }

    // Se APROVADO, devolver moedas ao profissional
    if (status === 'aprovado') {
      // Buscar saldo atual do profissional
      const { data: profissional, error: profError } = await supabase
        .from('profissionais')
        .select('saldo_moedas')
        .eq('id', reembolso.profissional_id)
        .single()

      if (profError || !profissional) {
        return NextResponse.json(
          { error: 'Profissional não encontrado' },
          { status: 404 }
        )
      }

      const novoSaldo = (profissional.saldo_moedas || 0) + reembolso.moedas_gastas

      // Atualizar saldo do profissional
      const { error: updateSaldoError } = await supabase
        .from('profissionais')
        .update({ saldo_moedas: novoSaldo })
        .eq('id', reembolso.profissional_id)

      if (updateSaldoError) {
        console.error('Erro ao atualizar saldo:', updateSaldoError)
        return NextResponse.json(
          { error: 'Erro ao devolver moedas' },
          { status: 500 }
        )
      }

      // Registrar transação de reembolso
      await supabase.from('transacoes_moedas').insert({
        profissional_id: reembolso.profissional_id,
        tipo: 'reembolso',
        quantidade: reembolso.moedas_gastas,
        descricao: `Reembolso aprovado - ${reembolso.solicitacao_id}`,
        saldo_anterior: profissional.saldo_moedas,
        saldo_novo: novoSaldo,
        payment_id: `REEMBOLSO-${reembolso_id}`,
        payment_status: 'approved'
      })
    }

    // Atualizar status do reembolso
    const { data: reembolsoAtualizado, error: updateError } = await supabase
      .from('solicitacoes_reembolso')
      .update({
        status,
        admin_id,
        resposta_admin: resposta_admin || null,
        analisado_em: new Date().toISOString()
      })
      .eq('id', reembolso_id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar reembolso:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar reembolso' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Reembolso ${status} com sucesso!`,
      reembolso: reembolsoAtualizado
    })

  } catch (error) {
    console.error('Erro ao analisar reembolso:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
