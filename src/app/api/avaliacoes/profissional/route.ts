import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

    // Buscar avaliações do profissional
    const { data: avaliacoes, error: avaliacoesError } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('profissional_id', profissional_id)
      .order('created_at', { ascending: false })

    if (avaliacoesError) {
      console.error('Erro ao buscar avaliações:', avaliacoesError)
      return NextResponse.json(
        { error: 'Erro ao buscar avaliações' },
        { status: 500 }
      )
    }

    // Buscar dados dos clientes
    const avaliacoesComClientes = await Promise.all(
      (avaliacoes || []).map(async (avaliacao: any) => {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('nome')
          .eq('id', avaliacao.cliente_id)
          .single()

        const { data: solicitacao } = await supabase
          .from('solicitacoes')
          .select('titulo, categoria_id')
          .eq('id', avaliacao.solicitacao_id)
          .single()

        const { data: categoria } = await supabase
          .from('categorias')
          .select('nome')
          .eq('id', solicitacao?.categoria_id)
          .single()

        return {
          ...avaliacao,
          cliente_nome: cliente?.nome || 'Cliente',
          solicitacao_titulo: solicitacao?.titulo || '',
          categoria_nome: categoria?.nome || ''
        }
      })
    )

    // Calcular média de notas
    const totalAvaliacoes = avaliacoes?.length || 0
    const somaNotas = avaliacoes?.reduce((acc: number, av: any) => acc + av.nota, 0) || 0
    const mediaNotas = totalAvaliacoes > 0 ? (somaNotas / totalAvaliacoes).toFixed(1) : 0

    // Calcular distribuição de notas
    const distribuicao = {
      5: avaliacoes?.filter((av: any) => av.nota === 5).length || 0,
      4: avaliacoes?.filter((av: any) => av.nota === 4).length || 0,
      3: avaliacoes?.filter((av: any) => av.nota === 3).length || 0,
      2: avaliacoes?.filter((av: any) => av.nota === 2).length || 0,
      1: avaliacoes?.filter((av: any) => av.nota === 1).length || 0,
    }

    return NextResponse.json({
      avaliacoes: avaliacoesComClientes,
      estatisticas: {
        total: totalAvaliacoes,
        media: parseFloat(mediaNotas as string),
        distribuicao
      }
    })

  } catch (error) {
    console.error('Erro ao buscar avaliações:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
