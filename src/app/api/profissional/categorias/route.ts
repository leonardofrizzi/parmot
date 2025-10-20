import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Buscar categorias do profissional
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profissional_id = searchParams.get('profissional_id')

    if (!profissional_id) {
      return NextResponse.json(
        { error: 'profissional_id é obrigatório' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('profissional_categorias')
      .select('*')
      .eq('profissional_id', profissional_id)

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar categorias' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      categorias: data
    })

  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar categorias do profissional
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { profissional_id, categorias, atende_online } = body

    if (!profissional_id || !categorias || !Array.isArray(categorias)) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Deletar todas as categorias antigas
    const { error: deleteError } = await supabase
      .from('profissional_categorias')
      .delete()
      .eq('profissional_id', profissional_id)

    if (deleteError) {
      console.error('Erro ao deletar categorias antigas:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao atualizar categorias' },
        { status: 500 }
      )
    }

    // Inserir novas categorias
    if (categorias.length > 0) {
      const inserts = categorias.map(categoria_id => ({
        profissional_id,
        categoria_id
      }))

      const { error: insertError } = await supabase
        .from('profissional_categorias')
        .insert(inserts)

      if (insertError) {
        console.error('Erro ao inserir categorias:', insertError)
        return NextResponse.json(
          { error: 'Erro ao atualizar categorias' },
          { status: 500 }
        )
      }
    }

    // Atualizar campo atende_online
    const { error: updateError } = await supabase
      .from('profissionais')
      .update({ atende_online })
      .eq('id', profissional_id)

    if (updateError) {
      console.error('Erro ao atualizar atende_online:', updateError)
    }

    return NextResponse.json({
      message: 'Categorias atualizadas com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao atualizar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
