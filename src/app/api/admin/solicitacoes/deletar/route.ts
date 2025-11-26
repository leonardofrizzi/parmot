import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { solicitacao_id } = await request.json()

    if (!solicitacao_id) {
      return NextResponse.json(
        { error: 'ID da solicitação é obrigatório' },
        { status: 400 }
      )
    }

    // Primeiro, deletar as respostas relacionadas
    await supabase
      .from('respostas')
      .delete()
      .eq('solicitacao_id', solicitacao_id)

    // Depois, deletar a solicitação
    const { error } = await supabase
      .from('solicitacoes')
      .delete()
      .eq('id', solicitacao_id)

    if (error) {
      console.error('Erro ao deletar solicitação:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar solicitação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Solicitação excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar solicitação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
