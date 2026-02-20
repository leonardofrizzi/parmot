import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { profissional_id, solicitacao_id } = await request.json()

    if (!profissional_id || !solicitacao_id) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Verificar se o profissional liberou o contato desta solicitação
    const { data: resposta, error: respostaError } = await supabaseAdmin
      .from('respostas')
      .select('id, solicitacao_id, contato_liberado, negocio_fechado')
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

    // Já foi marcado como fechado
    if (resposta.negocio_fechado) {
      return NextResponse.json(
        { error: 'Você já marcou este atendimento como negócio fechado.' },
        { status: 400 }
      )
    }

    // Anti-fraude: bloquear se já usou garantia
    const { data: reembolsoExistente } = await supabaseAdmin
      .from('solicitacoes_reembolso')
      .select('id')
      .eq('resposta_id', resposta.id)
      .single()

    if (reembolsoExistente) {
      return NextResponse.json(
        { error: 'Você já solicitou garantia para este atendimento. Não é possível marcar como negócio fechado.' },
        { status: 400 }
      )
    }

    // Marcar resposta como negócio fechado
    const { error: updateRespostaError } = await supabaseAdmin
      .from('respostas')
      .update({ negocio_fechado: true })
      .eq('id', resposta.id)

    if (updateRespostaError) {
      console.error('Erro ao atualizar resposta:', updateRespostaError)
      return NextResponse.json(
        { error: 'Erro ao fechar negócio' },
        { status: 500 }
      )
    }

    // Finalizar a solicitação e marcar este profissional como contratado
    const { error: updateSolicError } = await supabaseAdmin
      .from('solicitacoes')
      .update({
        status: 'finalizada',
        profissional_contratado_id: profissional_id
      })
      .eq('id', solicitacao_id)

    if (updateSolicError) {
      console.error('Erro ao finalizar solicitação:', updateSolicError)
      return NextResponse.json(
        { error: 'Erro ao finalizar solicitação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Negócio fechado com sucesso!',
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
