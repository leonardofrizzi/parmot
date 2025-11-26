import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const CUSTO_CONTATO_NORMAL = 15
const CUSTO_CONTATO_EXCLUSIVO = 50
const MAX_PROFISSIONAIS = 4

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profissional_id, solicitacao_id, exclusivo } = body

    if (!profissional_id || !solicitacao_id) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const custo = exclusivo ? CUSTO_CONTATO_EXCLUSIVO : CUSTO_CONTATO_NORMAL

    // 1. Buscar profissional e verificar saldo
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select('saldo_moedas')
      .eq('id', profissional_id)
      .single()

    if (profError || !profissional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    if (profissional.saldo_moedas < custo) {
      return NextResponse.json(
        { error: 'Saldo insuficiente' },
        { status: 400 }
      )
    }

    // 2. Verificar se já liberou
    const { data: jaLiberou } = await supabase
      .from('respostas')
      .select('id')
      .eq('solicitacao_id', solicitacao_id)
      .eq('profissional_id', profissional_id)
      .eq('contato_liberado', true)

    if (jaLiberou && jaLiberou.length > 0) {
      return NextResponse.json(
        { error: 'Você já liberou este contato' },
        { status: 400 }
      )
    }

    // 3. Verificar limite de profissionais (apenas para modo normal)
    if (!exclusivo) {
      const { data: respostas } = await supabase
        .from('respostas')
        .select('id')
        .eq('solicitacao_id', solicitacao_id)
        .eq('contato_liberado', true)

      if (respostas && respostas.length >= MAX_PROFISSIONAIS) {
        return NextResponse.json(
          { error: 'Limite de profissionais atingido' },
          { status: 400 }
        )
      }
    }

    // 4. Verificar se solicitação está aberta
    const { data: solicitacao } = await supabase
      .from('solicitacoes')
      .select('status')
      .eq('id', solicitacao_id)
      .single()

    if (!solicitacao || solicitacao.status !== 'aberta') {
      return NextResponse.json(
        { error: 'Solicitação não está mais disponível' },
        { status: 400 }
      )
    }

    // 5. Criar resposta liberando o contato
    const { error: respostaError } = await supabase
      .from('respostas')
      .insert({
        solicitacao_id,
        profissional_id,
        mensagem: exclusivo ? 'Contato liberado com exclusividade' : 'Contato liberado',
        contato_liberado: true
      })

    if (respostaError) {
      console.error('Erro ao criar resposta:', respostaError)
      return NextResponse.json(
        { error: 'Erro ao liberar contato' },
        { status: 500 }
      )
    }

    // 6. Debitar moedas do profissional
    const novoSaldo = profissional.saldo_moedas - custo

    const { error: updateError } = await supabase
      .from('profissionais')
      .update({ saldo_moedas: novoSaldo })
      .eq('id', profissional_id)

    if (updateError) {
      console.error('Erro ao atualizar saldo:', updateError)
      return NextResponse.json(
        { error: 'Erro ao processar pagamento' },
        { status: 500 }
      )
    }

    // 7. Registrar transação
    await supabase
      .from('transacoes_moedas')
      .insert({
        profissional_id,
        tipo: 'uso',
        quantidade: -custo,
        descricao: `Liberação de contato ${exclusivo ? '(exclusivo)' : '(padrão)'} - Solicitação #${solicitacao_id.substring(0, 8)}`
      })

    // 8. Se for exclusivo, atualizar status da solicitação
    if (exclusivo) {
      await supabase
        .from('solicitacoes')
        .update({ status: 'em_andamento' })
        .eq('id', solicitacao_id)
    }

    return NextResponse.json({
      message: 'Contato liberado com sucesso!',
      novo_saldo: novoSaldo
    })

  } catch (error) {
    console.error('Erro ao liberar contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
