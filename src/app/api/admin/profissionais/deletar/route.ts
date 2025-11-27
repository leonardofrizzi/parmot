import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(request: NextRequest) {
  try {
    const { profissional_id } = await request.json()

    if (!profissional_id) {
      return NextResponse.json(
        { error: 'ID do profissional é obrigatório' },
        { status: 400 }
      )
    }

    // Deletar profissional (usando supabaseAdmin para bypass RLS)
    const { error } = await supabaseAdmin
      .from('profissionais')
      .delete()
      .eq('id', profissional_id)

    if (error) {
      console.error('Erro ao deletar profissional:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar profissional' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Profissional removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar profissional:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
