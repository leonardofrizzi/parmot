import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      profissional_id,
      resposta_id,
      motivo,
      provas_urls
    } = await request.json()

    // Validações
    if (!profissional_id || !resposta_id || !motivo) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (motivo.trim().length < 20) {
      return NextResponse.json(
        { error: 'O motivo deve ter no mínimo 20 caracteres' },
        { status: 400 }
      )
    }

    // Buscar dados da resposta
    const { data: resposta, error: respostaError } = await supabase
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

    // Buscar dados da solicitação para pegar cliente_id
    const { data: solicitacao, error: solicitacaoError } = await supabase
      .from('solicitacoes')
      .select('id, cliente_id')
      .eq('id', resposta.solicitacao_id)
      .single()

    if (solicitacaoError || !solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já existe solicitação de reembolso para esta resposta
    const { data: reembolsoExistente } = await supabase
      .from('solicitacoes_reembolso')
      .select('id, status')
      .eq('resposta_id', resposta_id)
      .single()

    if (reembolsoExistente) {
      return NextResponse.json(
        {
          error: `Já existe uma solicitação de reembolso ${
            reembolsoExistente.status === 'pendente' ? 'pendente' :
            reembolsoExistente.status === 'aprovado' ? 'aprovada' : 'negada'
          } para este atendimento`
        },
        { status: 400 }
      )
    }

    // Determinar moedas gastas
    const moedas_gastas = resposta.exclusivo ? 20 : 5
    const tipo_contato = resposta.exclusivo ? 'exclusivo' : 'normal'

    // Criar solicitação de reembolso
    const { data: reembolso, error: reembolsoError } = await supabase
      .from('solicitacoes_reembolso')
      .insert({
        profissional_id,
        resposta_id,
        solicitacao_id: resposta.solicitacao_id,
        cliente_id: solicitacao.cliente_id,
        motivo: motivo.trim(),
        provas_urls: provas_urls || [],
        moedas_gastas,
        tipo_contato,
        status: 'pendente'
      })
      .select()
      .single()

    if (reembolsoError) {
      console.error('Erro ao criar solicitação de reembolso:', reembolsoError)
      return NextResponse.json(
        { error: 'Erro ao criar solicitação de reembolso' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Solicitação de reembolso enviada com sucesso! Aguarde análise do administrador.',
      reembolso
    })

  } catch (error) {
    console.error('Erro ao solicitar reembolso:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
