import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filtro = searchParams.get('filtro') || 'pendentes'

    let query = supabase
      .from('profissionais')
      .select(`
        id,
        nome,
        email,
        telefone,
        cidade,
        estado,
        profissao,
        aprovado,
        created_at
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtro
    if (filtro === 'pendentes') {
      query = query.eq('aprovado', false)
    } else if (filtro === 'aprovados') {
      query = query.eq('aprovado', true)
    }
    // 'todos' não precisa de filtro adicional

    const { data: profissionais, error } = await query

    if (error) {
      console.error('Erro ao buscar profissionais:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar profissionais' },
        { status: 500 }
      )
    }

    // Buscar categorias de cada profissional
    const profissionaisComCategorias = await Promise.all(
      profissionais.map(async (prof: any) => {
        const { data: categoriasProf } = await supabase
          .from('profissional_categorias')
          .select('categoria_id')
          .eq('profissional_id', prof.id)

        const categoriaIds = categoriasProf?.map(c => c.categoria_id) || []

        if (categoriaIds.length > 0) {
          const { data: categorias } = await supabase
            .from('categorias')
            .select('nome')
            .in('id', categoriaIds)

          return {
            ...prof,
            categorias: categorias?.map(c => c.nome) || []
          }
        }

        return {
          ...prof,
          categorias: []
        }
      })
    )

    return NextResponse.json({
      profissionais: profissionaisComCategorias
    })

  } catch (error) {
    console.error('Erro ao listar profissionais:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
