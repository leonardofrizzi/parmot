import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profissionalId = searchParams.get('profissional_id')

    let query = supabaseAdmin
      .from('avaliacoes')
      .select('*')
      .order('created_at', { ascending: false })

    if (profissionalId) {
      query = query.eq('profissional_id', profissionalId)
    }

    const { data: avaliacoes, error } = await query

    if (error) {
      console.error('Erro ao buscar avaliações:', error)
      return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 })
    }

    // Buscar dados adicionais
    const avaliacoesComDados = await Promise.all(
      (avaliacoes || []).map(async (av: Record<string, unknown>) => {
        const { data: prof } = await supabaseAdmin
          .from('profissionais')
          .select('nome')
          .eq('id', av.profissional_id)
          .single()

        const { data: cliente } = await supabaseAdmin
          .from('clientes')
          .select('nome')
          .eq('id', av.cliente_id)
          .single()

        return {
          ...av,
          profissional_nome: prof?.nome || 'Desconhecido',
          cliente_nome: cliente?.nome || 'Desconhecido'
        }
      })
    )

    // Calcular estatísticas
    const total = avaliacoesComDados.length
    const soma = avaliacoesComDados.reduce((s: number, a: Record<string, unknown>) => s + (a.nota as number), 0)
    const media = total > 0 ? soma / total : 0

    const distribuicao = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    avaliacoesComDados.forEach((a: Record<string, unknown>) => {
      const nota = a.nota as number
      if (nota >= 1 && nota <= 5) {
        distribuicao[nota as keyof typeof distribuicao]++
      }
    })

    return NextResponse.json({
      avaliacoes: avaliacoesComDados,
      estatisticas: {
        total,
        media: parseFloat(media.toFixed(1)),
        distribuicao
      }
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
