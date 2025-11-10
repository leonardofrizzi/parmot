import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const { solicitacao_id, aprovado } = await request.json()

    if (!solicitacao_id) {
      return NextResponse.json(
        { error: 'ID da solicitação é obrigatório' },
        { status: 400 }
      )
    }

    // Atualizar status de aprovação
    const updateData = aprovado
      ? {
          aprovado_admin: true,
          aprovado_admin_em: new Date().toISOString()
        }
      : {
          aprovado_admin: false,
          aprovado_admin_em: null
        }

    const { error } = await supabase
      .from('solicitacoes')
      .update(updateData)
      .eq('id', solicitacao_id)

    if (error) {
      console.error('Erro ao atualizar solicitação:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar solicitação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: aprovado ? 'Solicitação aprovada com sucesso' : 'Solicitação recusada'
    })

  } catch (error) {
    console.error('Erro ao processar aprovação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
