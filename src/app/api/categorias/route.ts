import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Buscar todas as categorias ordenadas
    const { data: categorias, error: categoriasError } = await supabase
      .from('categorias')
      .select('*')
      .order('ordem', { ascending: true })

    if (categoriasError) {
      console.error('Erro ao buscar categorias:', categoriasError)
      return NextResponse.json(
        { error: 'Erro ao buscar categorias' },
        { status: 500 }
      )
    }

    // Buscar todas as subcategorias ordenadas
    const { data: subcategorias, error: subcategoriasError } = await supabase
      .from('subcategorias')
      .select('*')
      .order('ordem', { ascending: true })

    if (subcategoriasError) {
      console.error('Erro ao buscar subcategorias:', subcategoriasError)
      return NextResponse.json(
        { error: 'Erro ao buscar subcategorias' },
        { status: 500 }
      )
    }

    // Organizar subcategorias por categoria
    const categoriasComSubs = categorias.map(categoria => ({
      ...categoria,
      subcategorias: subcategorias.filter(sub => sub.categoria_id === categoria.id)
    }))

    return NextResponse.json({
      categorias: categoriasComSubs
    })

  } catch (error) {
    console.error('Erro ao listar categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
