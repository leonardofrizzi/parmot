import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pendente'

    // Buscar reembolsos
    let query = supabase
      .from('solicitacoes_reembolso')
      .select('*')
      .order('created_at', { ascending: false })

    if (status !== 'todos') {
      query = query.eq('status', status)
    }

    const { data: reembolsos, error: reembolsosError } = await query

    if (reembolsosError) {
      console.error('Erro ao buscar reembolsos:', reembolsosError)
      return NextResponse.json(
        { error: 'Erro ao buscar reembolsos' },
        { status: 500 }
      )
    }

    // Buscar detalhes de cada reembolso
    const reembolsosComDetalhes = await Promise.all(
      (reembolsos || []).map(async (reembolso: any) => {
        // Profissional
        const { data: profissional } = await supabase
          .from('profissionais')
          .select('nome, email, telefone')
          .eq('id', reembolso.profissional_id)
          .single()

        // Solicitação
        const { data: solicitacao } = await supabase
          .from('solicitacoes')
          .select('titulo, categoria_id')
          .eq('id', reembolso.solicitacao_id)
          .single()

        // Categoria
        const { data: categoria } = await supabase
          .from('categorias')
          .select('nome')
          .eq('id', solicitacao?.categoria_id)
          .single()

        // Cliente
        const { data: cliente } = await supabase
          .from('clientes')
          .select('nome, email')
          .eq('id', reembolso.cliente_id)
          .single()

        return {
          ...reembolso,
          profissional_nome: profissional?.nome || '',
          profissional_email: profissional?.email || '',
          profissional_telefone: profissional?.telefone || '',
          solicitacao_titulo: solicitacao?.titulo || '',
          categoria_nome: categoria?.nome || '',
          cliente_nome: cliente?.nome || '',
          cliente_email: cliente?.email || ''
        }
      })
    )

    // Estatísticas
    const { count: totalPendentes } = await supabase
      .from('solicitacoes_reembolso')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendente')

    const { count: totalAprovados } = await supabase
      .from('solicitacoes_reembolso')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'aprovado')

    const { count: totalNegados } = await supabase
      .from('solicitacoes_reembolso')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'negado')

    return NextResponse.json({
      reembolsos: reembolsosComDetalhes,
      estatisticas: {
        pendentes: totalPendentes || 0,
        aprovados: totalAprovados || 0,
        negados: totalNegados || 0,
        total: (totalPendentes || 0) + (totalAprovados || 0) + (totalNegados || 0)
      }
    })

  } catch (error) {
    console.error('Erro ao listar reembolsos:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
