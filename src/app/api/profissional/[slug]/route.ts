import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Verificar se é um UUID ou slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

    // Se for UUID, retornar todos os dados (uso interno do dashboard)
    if (isUUID) {
      // Usar supabaseAdmin para bypass de RLS e garantir acesso a todos os campos
      const { data: profissional, error } = await supabaseAdmin
        .from('profissionais')
        .select('*')
        .eq('id', slug)
        .single()

      if (error || !profissional) {
        console.error('Erro ao buscar profissional:', error)
        return NextResponse.json(
          { error: 'Profissional não encontrado' },
          { status: 404 }
        )
      }

      // Não retornar senha_hash
      const { senha_hash, ...profissionalSemSenha } = profissional

      return NextResponse.json({
        profissional: profissionalSemSenha
      })
    }

    // Se for slug, retornar dados públicos (perfil público)
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select(`
        id,
        nome,
        razao_social,
        tipo,
        cidade,
        estado,
        slug,
        foto_url,
        sobre,
        aprovado,
        created_at
      `)
      .eq('slug', slug)
      .single()

    if (profError || !profissional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se está aprovado
    if (!profissional.aprovado) {
      return NextResponse.json(
        { error: 'Profissional ainda não aprovado' },
        { status: 403 }
      )
    }

    // Buscar avaliações do profissional
    const { data: avaliacoes, error: avalError } = await supabase
      .from('avaliacoes')
      .select(`
        id,
        nota,
        comentario,
        resposta_profissional,
        created_at,
        clientes (
          nome
        )
      `)
      .eq('profissional_id', profissional.id)
      .eq('visivel', true)
      .order('created_at', { ascending: false })

    // Calcular média das avaliações
    let mediaAvaliacoes = 0
    let totalAvaliacoes = 0

    if (avaliacoes && avaliacoes.length > 0) {
      totalAvaliacoes = avaliacoes.length
      const somaNotas = avaliacoes.reduce((acc, av) => acc + av.nota, 0)
      mediaAvaliacoes = Math.round((somaNotas / totalAvaliacoes) * 10) / 10
    }

    // Buscar categorias do profissional
    const { data: categorias } = await supabase
      .from('profissional_categorias')
      .select(`
        categorias (
          id,
          nome
        )
      `)
      .eq('profissional_id', profissional.id)

    // Buscar selo de qualidade ativo
    const { data: seloAtivo } = await supabase
      .from('selos_qualidade')
      .select('*')
      .eq('profissional_id', profissional.id)
      .eq('ativo', true)
      .gte('data_fim', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      profissional: {
        ...profissional,
        categorias: categorias?.map((c: any) => c.categorias) || []
      },
      avaliacoes: avaliacoes || [],
      estatisticas: {
        media: mediaAvaliacoes,
        total: totalAvaliacoes
      },
      selo: seloAtivo || null
    })

  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    )
  }
}
