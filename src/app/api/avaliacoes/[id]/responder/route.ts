import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Profissional responde a uma avaliação
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { profissional_id, resposta } = body

    if (!profissional_id || !resposta) {
      return NextResponse.json(
        { error: 'Profissional e resposta são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a avaliação existe e pertence ao profissional
    const { data: avaliacao, error: fetchError } = await supabase
      .from('avaliacoes')
      .select('id, profissional_id')
      .eq('id', id)
      .single()

    if (fetchError || !avaliacao) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    if (avaliacao.profissional_id !== profissional_id) {
      return NextResponse.json(
        { error: 'Você não pode responder a esta avaliação' },
        { status: 403 }
      )
    }

    // Atualizar com a resposta
    const { data, error } = await supabase
      .from('avaliacoes')
      .update({ resposta_profissional: resposta })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao responder avaliação:', error)
      return NextResponse.json(
        { error: 'Erro ao enviar resposta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Resposta enviada com sucesso!',
      avaliacao: data
    })

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
