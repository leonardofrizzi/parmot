import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cliente_id = searchParams.get('cliente_id')

    if (!cliente_id) {
      return NextResponse.json(
        { error: 'cliente_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar todas as solicitações do cliente
    const { data: solicitacoes, error } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        categorias:categoria_id(nome, slug, icone),
        subcategorias:subcategoria_id(nome, slug)
      `)
      .eq('cliente_id', cliente_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar solicitações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar solicitações' },
        { status: 500 }
      )
    }

    // Para cada solicitação, contar quantos profissionais liberaram
    const solicitacoesComStats = await Promise.all(
      solicitacoes.map(async (solicitacao: any) => {
        // Contar respostas com contato liberado
        const { count: totalLiberacoes } = await supabase
          .from('respostas')
          .select('*', { count: 'exact', head: true })
          .eq('solicitacao_id', solicitacao.id)
          .eq('contato_liberado', true)

        // Verificar se tem alguma liberação exclusiva
        const { data: exclusivas } = await supabase
          .from('respostas')
          .select('exclusivo, profissional_id, profissionais:profissional_id(nome, email, telefone)')
          .eq('solicitacao_id', solicitacao.id)
          .eq('contato_liberado', true)
          .eq('exclusivo', true)
          .limit(1)

        const temExclusivo = exclusivas && exclusivas.length > 0

        return {
          ...solicitacao,
          categoria_nome: solicitacao.categorias?.nome || '',
          categoria_icone: solicitacao.categorias?.icone || '',
          subcategoria_nome: solicitacao.subcategorias?.nome || '',
          total_profissionais_interessados: totalLiberacoes || 0,
          tem_exclusivo: temExclusivo,
          profissional_exclusivo: temExclusivo ? exclusivas[0]?.profissionais : null
        }
      })
    )

    return NextResponse.json({
      solicitacoes: solicitacoesComStats
    })

  } catch (error) {
    console.error('Erro ao listar solicitações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
