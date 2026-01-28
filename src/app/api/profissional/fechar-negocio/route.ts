import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { profissional_id, solicitacao_id, resposta_id } = await request.json()

    if (!profissional_id || !solicitacao_id) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Verificar se o profissional liberou o contato desta solicitação
    const { data: resposta, error: respostaError } = await supabase
      .from('respostas')
      .select('id, solicitacao_id, contato_liberado')
      .eq('profissional_id', profissional_id)
      .eq('solicitacao_id', solicitacao_id)
      .eq('contato_liberado', true)
      .single()

    if (respostaError || !resposta) {
      return NextResponse.json(
        { error: 'Você não tem acesso a esta solicitação' },
        { status: 403 }
      )
    }

    // Atualizar status da solicitação para finalizada
    const { error: updateError } = await supabase
      .from('solicitacoes')
      .update({ status: 'finalizada' })
      .eq('id', solicitacao_id)

    if (updateError) {
      console.error('Erro ao fechar negócio:', updateError)
      return NextResponse.json(
        { error: 'Erro ao fechar negócio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Negócio fechado com sucesso! A solicitação foi marcada como concluída.',
      success: true
    })

  } catch (error) {
    console.error('Erro ao fechar negócio:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
