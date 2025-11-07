import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(request: NextRequest) {
  try {
    const { profissional_id, aprovado } = await request.json()

    if (!profissional_id || aprovado === undefined) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('profissionais')
      .update({ aprovado })
      .eq('id', profissional_id)

    if (error) {
      console.error('Erro ao atualizar profissional:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar profissional' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: aprovado ? 'Profissional aprovado com sucesso' : 'Aprovação revogada'
    })

  } catch (error) {
    console.error('Erro ao aprovar profissional:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
