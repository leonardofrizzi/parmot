import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filtro = searchParams.get('filtro') || 'todas'

    let query = supabase
      .from('solicitacoes')
      .select(`
        id,
        titulo,
        descricao,
        status,
        created_at,
        categoria_id,
        subcategoria_id,
        cliente_id,
        aprovado_admin,
        aprovado_admin_em
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtro
    if (filtro === 'pendentes') {
      query = query.eq('aprovado_admin', false)
    } else if (filtro !== 'todas') {
      query = query.eq('status', filtro)
    }

    const { data: solicitacoes, error } = await query

    if (error) {
      console.error('Erro ao buscar solicitações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar solicitações' },
        { status: 500 }
      )
    }

    // Buscar informações adicionais
    const solicitacoesCompletas = await Promise.all(
      solicitacoes.map(async (sol: any) => {
        // Buscar cliente
        const { data: cliente } = await supabase
          .from('clientes')
          .select('nome, email, cidade, estado')
          .eq('id', sol.cliente_id)
          .single()

        // Buscar categoria
        const { data: categoria } = await supabase
          .from('categorias')
          .select('nome')
          .eq('id', sol.categoria_id)
          .single()

        // Buscar subcategoria
        const { data: subcategoria } = await supabase
          .from('subcategorias')
          .select('nome')
          .eq('id', sol.subcategoria_id)
          .single()

        // Contar respostas
        const { count: total_respostas } = await supabase
          .from('respostas')
          .select('*', { count: 'exact', head: true })
          .eq('solicitacao_id', sol.id)

        return {
          id: sol.id,
          titulo: sol.titulo,
          descricao: sol.descricao,
          status: sol.status,
          created_at: sol.created_at,
          cliente_nome: cliente?.nome || 'N/A',
          cliente_email: cliente?.email || 'N/A',
          cliente_cidade: cliente?.cidade || 'N/A',
          cliente_estado: cliente?.estado || 'N/A',
          categoria_nome: categoria?.nome || 'N/A',
          subcategoria_nome: subcategoria?.nome || 'N/A',
          total_respostas: total_respostas || 0,
          aprovado_admin: sol.aprovado_admin || false,
          aprovado_admin_em: sol.aprovado_admin_em
        }
      })
    )

    return NextResponse.json({
      solicitacoes: solicitacoesCompletas
    })

  } catch (error) {
    console.error('Erro ao listar solicitações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
