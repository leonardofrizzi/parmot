import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  console.log('=== API ADMIN PROFISSIONAIS ===')
  try {
    const { searchParams } = new URL(request.url)
    const filtro = searchParams.get('filtro') || 'pendentes'
    console.log('Filtro:', filtro)

    // Usar supabaseAdmin para ignorar RLS e ver todos os profissionais
    let query = supabaseAdmin
      .from('profissionais')
      .select(`
        id,
        tipo,
        nome,
        razao_social,
        email,
        telefone,
        cpf_cnpj,
        cidade,
        estado,
        aprovado,
        banido,
        banido_em,
        motivo_banimento,
        created_at,
        identidade_frente_url,
        identidade_verso_url,
        documento_empresa_url,
        diplomas_urls,
        termos_aceitos_em,
        termos_versao,
        termos_ip
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtro
    if (filtro === 'pendentes') {
      query = query.eq('aprovado', false).or('banido.is.null,banido.eq.false')
    } else if (filtro === 'aprovados') {
      query = query.eq('aprovado', true).or('banido.is.null,banido.eq.false')
    } else if (filtro === 'banidos') {
      query = query.eq('banido', true)
    }
    // 'todos' não precisa de filtro adicional

    const { data: profissionais, error } = await query

    console.log('Profissionais encontrados:', profissionais?.length || 0)
    if (profissionais && profissionais.length > 0) {
      console.log('Primeiro profissional:', profissionais[0]?.nome, profissionais[0]?.aprovado)
      console.log('Diplomas do primeiro:', JSON.stringify(profissionais[0]?.diplomas_urls))
    }

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
        const { data: categoriasProf } = await supabaseAdmin
          .from('profissional_categorias')
          .select('categoria_id')
          .eq('profissional_id', prof.id)

        const categoriaIds = categoriasProf?.map(c => c.categoria_id) || []

        if (categoriaIds.length > 0) {
          const { data: categorias } = await supabaseAdmin
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
