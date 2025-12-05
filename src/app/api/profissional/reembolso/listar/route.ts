import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar service role para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profissional_id = searchParams.get('profissional_id')

    if (!profissional_id) {
      return NextResponse.json(
        { error: 'ID do profissional é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar reembolsos do profissional
    const { data: reembolsos, error: reembolsosError } = await supabase
      .from('solicitacoes_reembolso')
      .select('*')
      .eq('profissional_id', profissional_id)
      .order('created_at', { ascending: false })

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
        // Buscar solicitação
        const { data: solicitacao } = await supabase
          .from('solicitacoes')
          .select('titulo, categoria_id')
          .eq('id', reembolso.solicitacao_id)
          .single()

        // Buscar categoria
        const { data: categoria } = await supabase
          .from('categorias')
          .select('nome')
          .eq('id', solicitacao?.categoria_id)
          .single()

        // Buscar cliente
        const { data: cliente } = await supabase
          .from('clientes')
          .select('nome')
          .eq('id', reembolso.cliente_id)
          .single()

        return {
          ...reembolso,
          solicitacao_titulo: solicitacao?.titulo || '',
          categoria_nome: categoria?.nome || '',
          cliente_nome: cliente?.nome || ''
        }
      })
    )

    return NextResponse.json({
      reembolsos: reembolsosComDetalhes
    })

  } catch (error) {
    console.error('Erro ao listar reembolsos:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
