import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status, cliente_id } = await request.json()
    const { id: solicitacao_id } = await params

    if (!status || !cliente_id) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Validar status permitido (usar 'finalizada' em vez de 'concluida')
    const statusPermitidos = ['aberta', 'em_andamento', 'finalizada', 'cancelada']
    if (!statusPermitidos.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Verificar se a solicitação pertence ao cliente
    const { data: solicitacao, error: solicitacaoError } = await supabase
      .from('solicitacoes')
      .select('id, cliente_id, status')
      .eq('id', solicitacao_id)
      .eq('cliente_id', cliente_id)
      .single()

    if (solicitacaoError || !solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada ou você não tem permissão' },
        { status: 404 }
      )
    }

    // Atualizar status
    const { data, error } = await supabase
      .from('solicitacoes')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', solicitacao_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar status:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar status da solicitação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Status atualizado com sucesso',
      solicitacao: data
    })

  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
