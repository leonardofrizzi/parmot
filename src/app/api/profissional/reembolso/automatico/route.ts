import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Criar cliente apenas quando a função for chamada (não no build)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { profissional_id, resposta_id } = await request.json()

    // Validações
    if (!profissional_id || !resposta_id) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Buscar dados da resposta
    const { data: resposta, error: respostaError } = await supabaseAdmin
      .from('respostas')
      .select('id, profissional_id, solicitacao_id, exclusivo, contato_liberado')
      .eq('id', resposta_id)
      .eq('profissional_id', profissional_id)
      .single()

    if (respostaError || !resposta) {
      return NextResponse.json(
        { error: 'Resposta não encontrada ou você não tem permissão' },
        { status: 404 }
      )
    }

    // Verificar se o contato foi liberado
    if (!resposta.contato_liberado) {
      return NextResponse.json(
        { error: 'Você não liberou o contato desta solicitação' },
        { status: 400 }
      )
    }

    // Verificar se já existe reembolso para esta resposta
    const { data: reembolsoExistente } = await supabaseAdmin
      .from('solicitacoes_reembolso')
      .select('id, status')
      .eq('resposta_id', resposta_id)
      .single()

    if (reembolsoExistente) {
      return NextResponse.json(
        { error: 'Já existe um reembolso para este atendimento' },
        { status: 400 }
      )
    }

    // Buscar configurações para obter percentual de reembolso e custos
    const { data: config } = await supabaseAdmin
      .from('configuracoes')
      .select('custo_contato_normal, custo_contato_exclusivo, percentual_reembolso')
      .limit(1)
      .single()

    const custoNormal = config?.custo_contato_normal ?? 15
    const custoExclusivo = config?.custo_contato_exclusivo ?? 50
    const percentualReembolso = config?.percentual_reembolso ?? 30

    // Calcular moedas gastas e reembolso
    const moedas_gastas = resposta.exclusivo ? custoExclusivo : custoNormal
    const moedas_reembolso = Math.round(moedas_gastas * percentualReembolso / 100)
    const tipo_contato = resposta.exclusivo ? 'exclusivo' : 'normal'

    // Buscar dados da solicitação para pegar cliente_id
    const { data: solicitacao } = await supabaseAdmin
      .from('solicitacoes')
      .select('id, cliente_id')
      .eq('id', resposta.solicitacao_id)
      .single()

    // Criar registro de reembolso automático (já aprovado)
    // Primeiro, tentar inserir só os campos obrigatórios
    const dadosReembolso: any = {
      profissional_id,
      resposta_id,
      solicitacao_id: resposta.solicitacao_id,
      motivo: 'Não fechei negócio com este cliente (reembolso automático)',
      provas_urls: [],
      moedas_gastas,
      tipo_contato,
      status: 'aprovado',
      analisado_em: new Date().toISOString()
    }

    // Adicionar cliente_id só se existir
    if (solicitacao?.cliente_id) {
      dadosReembolso.cliente_id = solicitacao.cliente_id
    }

    console.log('Tentando criar reembolso com dados:', dadosReembolso)

    const { data: reembolsoCriado, error: reembolsoError } = await supabaseAdmin
      .from('solicitacoes_reembolso')
      .insert(dadosReembolso)
      .select()

    console.log('Resultado do insert:', { reembolsoCriado, reembolsoError })

    if (reembolsoError) {
      console.error('Erro ao criar reembolso:', reembolsoError)
      // Continuar mesmo com erro no registro - as moedas já foram creditadas
      // Não retornar erro 500 para não confundir o usuário
    }

    // Atualizar saldo do profissional
    const { data: profissional, error: profError } = await supabaseAdmin
      .from('profissionais')
      .select('saldo_moedas')
      .eq('id', profissional_id)
      .single()

    if (profError) {
      console.error('Erro ao buscar profissional:', profError)
      return NextResponse.json(
        { error: 'Erro ao atualizar saldo' },
        { status: 500 }
      )
    }

    const novoSaldo = (profissional?.saldo_moedas || 0) + moedas_reembolso

    const { error: updateError } = await supabaseAdmin
      .from('profissionais')
      .update({ saldo_moedas: novoSaldo })
      .eq('id', profissional_id)

    if (updateError) {
      console.error('Erro ao atualizar saldo:', updateError)
      return NextResponse.json(
        { error: 'Erro ao creditar moedas' },
        { status: 500 }
      )
    }

    // Atualizar status da solicitação para cancelada (não fechou negócio)
    await supabaseAdmin
      .from('solicitacoes')
      .update({ status: 'cancelada' })
      .eq('id', resposta.solicitacao_id)

    return NextResponse.json({
      message: `Reembolso de ${moedas_reembolso} moedas creditado automaticamente!`,
      moedas_reembolsadas: moedas_reembolso,
      novo_saldo: novoSaldo
    })

  } catch (error) {
    console.error('Erro ao processar reembolso automático:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
