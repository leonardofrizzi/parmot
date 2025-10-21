import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const solicitacao_id = searchParams.get('solicitacao_id')

    if (!solicitacao_id) {
      return NextResponse.json(
        { error: 'ID da solicitação é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar avaliação da solicitação
    const { data: avaliacao, error: avaliacaoError } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('solicitacao_id', solicitacao_id)
      .single()

    if (avaliacaoError && avaliacaoError.code !== 'PGRST116') {
      // PGRST116 = não encontrado (esperado quando não há avaliação)
      console.error('Erro ao buscar avaliação:', avaliacaoError)
      return NextResponse.json(
        { error: 'Erro ao buscar avaliação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      avaliacao: avaliacao || null
    })

  } catch (error) {
    console.error('Erro ao buscar avaliação:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
