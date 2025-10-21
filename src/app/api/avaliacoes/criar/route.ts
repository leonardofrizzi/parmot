import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { solicitacao_id, cliente_id, profissional_id, nota, comentario } = await request.json()

    // Validações
    if (!solicitacao_id || !cliente_id || !profissional_id || !nota) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (nota < 1 || nota > 5) {
      return NextResponse.json(
        { error: 'A nota deve ser entre 1 e 5' },
        { status: 400 }
      )
    }

    // Verificar se a solicitação existe e pertence ao cliente
    const { data: solicitacao, error: solicitacaoError } = await supabase
      .from('solicitacoes')
      .select('id, cliente_id, status')
      .eq('id', solicitacao_id)
      .eq('cliente_id', cliente_id)
      .single()

    if (solicitacaoError || !solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada ou você não tem permissão para avaliá-la' },
        { status: 404 }
      )
    }

    // Verificar se a solicitação está finalizada
    if (solicitacao.status !== 'finalizada') {
      return NextResponse.json(
        { error: 'Você só pode avaliar serviços finalizados' },
        { status: 400 }
      )
    }

    // Verificar se o cliente contratou esse profissional
    const { data: resposta, error: respostaError } = await supabase
      .from('respostas')
      .select('id')
      .eq('solicitacao_id', solicitacao_id)
      .eq('profissional_id', profissional_id)
      .eq('contato_liberado', true)
      .single()

    if (respostaError || !resposta) {
      return NextResponse.json(
        { error: 'Você só pode avaliar profissionais que você contratou' },
        { status: 400 }
      )
    }

    // Verificar se já existe avaliação para esta solicitação
    const { data: avaliacaoExistente } = await supabase
      .from('avaliacoes')
      .select('id')
      .eq('solicitacao_id', solicitacao_id)
      .single()

    if (avaliacaoExistente) {
      return NextResponse.json(
        { error: 'Você já avaliou este serviço' },
        { status: 400 }
      )
    }

    // Criar avaliação
    const { data: avaliacao, error: avaliacaoError } = await supabase
      .from('avaliacoes')
      .insert({
        solicitacao_id,
        cliente_id,
        profissional_id,
        nota,
        comentario: comentario || null
      })
      .select()
      .single()

    if (avaliacaoError) {
      console.error('Erro ao criar avaliação:', avaliacaoError)
      return NextResponse.json(
        { error: 'Erro ao criar avaliação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Avaliação criada com sucesso!',
      avaliacao
    })

  } catch (error) {
    console.error('Erro ao criar avaliação:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
