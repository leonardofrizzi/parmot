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
        solicitacao_id,
        clientes (
          nome
        )
      `)
      .eq('profissional_id', profissional.id)
      .order('created_at', { ascending: false })

    // Enriquecer avaliações com título da solicitação
    const avaliacoesEnriquecidas = await Promise.all(
      (avaliacoes || []).map(async (av: any) => {
        if (av.solicitacao_id) {
          const { data: solicitacao } = await supabase
            .from('solicitacoes')
            .select('titulo, categoria_id')
            .eq('id', av.solicitacao_id)
            .single()

          let categoria_nome = ''
          if (solicitacao?.categoria_id) {
            const { data: categoria } = await supabase
              .from('categorias')
              .select('nome')
              .eq('id', solicitacao.categoria_id)
              .single()
            categoria_nome = categoria?.nome || ''
          }

          return {
            ...av,
            solicitacao_titulo: solicitacao?.titulo || '',
            categoria_nome
          }
        }
        return { ...av, solicitacao_titulo: '', categoria_nome: '' }
      })
    )

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

    // Buscar selos de qualidade ativos
    const { data: selosAtivos } = await supabase
      .from('selos_qualidade')
      .select('id, tipo, data_fim, media_avaliacoes, total_avaliacoes, tipo_selo_id')
      .eq('profissional_id', profissional.id)
      .eq('ativo', true)
      .gte('data_fim', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    // Buscar info dos tipos de selo
    const selosComTipo = await Promise.all(
      (selosAtivos || []).map(async (selo: any) => {
        if (selo.tipo_selo_id) {
          const { data: tipoSelo } = await supabase
            .from('tipos_selo')
            .select('nome, cor')
            .eq('id', selo.tipo_selo_id)
            .single()
          return { ...selo, tipo_selo: tipoSelo || null }
        }
        return { ...selo, tipo_selo: null }
      })
    )

    return NextResponse.json({
      profissional: {
        ...profissional,
        categorias: categorias?.map((c: any) => c.categorias) || []
      },
      avaliacoes: avaliacoesEnriquecidas || [],
      estatisticas: {
        media: mediaAvaliacoes,
        total: totalAvaliacoes
      },
      selo: selosComTipo[0] || null,
      selos: selosComTipo
    })

  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    )
  }
}
