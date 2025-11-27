import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Criar nova avaliação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profissional_id, cliente_id, solicitacao_id, nota, comentario } = body

    // Validações
    if (!profissional_id || !cliente_id || !nota) {
      return NextResponse.json(
        { error: 'Profissional, cliente e nota são obrigatórios' },
        { status: 400 }
      )
    }

    if (nota < 1 || nota > 5) {
      return NextResponse.json(
        { error: 'A nota deve ser entre 1 e 5' },
        { status: 400 }
      )
    }

    // Verificar se já existe avaliação para esta solicitação
    if (solicitacao_id) {
      const { data: avaliacaoExistente } = await supabase
        .from('avaliacoes')
        .select('id')
        .eq('solicitacao_id', solicitacao_id)
        .eq('cliente_id', cliente_id)
        .single()

      if (avaliacaoExistente) {
        return NextResponse.json(
          { error: 'Você já avaliou este atendimento' },
          { status: 409 }
        )
      }
    }

    // Criar avaliação
    const { data, error } = await supabase
      .from('avaliacoes')
      .insert({
        profissional_id,
        cliente_id,
        solicitacao_id: solicitacao_id || null,
        nota,
        comentario: comentario || null,
        visivel: true
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar avaliação:', error)
      return NextResponse.json(
        { error: 'Erro ao criar avaliação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Avaliação enviada com sucesso!',
      avaliacao: data
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao processar avaliação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Buscar avaliações (com filtros)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profissional_id = searchParams.get('profissional_id')
    const cliente_id = searchParams.get('cliente_id')

    let query = supabase
      .from('avaliacoes')
      .select(`
        *,
        profissionais (
          id,
          nome,
          razao_social,
          tipo
        ),
        clientes (
          id,
          nome
        )
      `)
      .eq('visivel', true)
      .order('created_at', { ascending: false })

    if (profissional_id) {
      query = query.eq('profissional_id', profissional_id)
    }

    if (cliente_id) {
      query = query.eq('cliente_id', cliente_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar avaliações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar avaliações' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
