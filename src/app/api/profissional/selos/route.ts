import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Buscar selos do profissional e verificar elegibilidade
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

    // Buscar selos ativos
    const { data: selosAtivos, error: selosError } = await supabase
      .from('selos_qualidade')
      .select('*')
      .eq('profissional_id', profissional_id)
      .eq('ativo', true)
      .gte('data_fim', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    if (selosError) {
      console.error('Erro ao buscar selos:', selosError)
    }

    // Calcular elegibilidade para novo selo
    // Buscar avaliações dos últimos 6 meses
    const seisAtras = new Date()
    seisAtras.setMonth(seisAtras.getMonth() - 6)

    const { data: avaliacoes, error: avalError } = await supabase
      .from('avaliacoes')
      .select('nota, created_at')
      .eq('profissional_id', profissional_id)
      .gte('created_at', seisAtras.toISOString())

    let elegivel = false
    let mediaAtual = 0
    let totalAvaliacoes = 0
    let proximaVerificacao = null

    if (avaliacoes && avaliacoes.length > 0) {
      totalAvaliacoes = avaliacoes.length
      const soma = avaliacoes.reduce((acc, av) => acc + av.nota, 0)
      mediaAtual = Math.round((soma / totalAvaliacoes) * 10) / 10

      // Elegível se média >= 4 e tem pelo menos 3 avaliações
      elegivel = mediaAtual >= 4 && totalAvaliacoes >= 3
    }

    // Verificar se já tem selo ativo do tipo qualidade_6m
    const seloQualidadeAtivo = selosAtivos?.find(s => s.tipo === 'qualidade_6m')

    // Se não tem selo ativo mas é elegível, criar automaticamente
    if (!seloQualidadeAtivo && elegivel) {
      const hoje = new Date()
      const dataFim = new Date()
      dataFim.setMonth(dataFim.getMonth() + 6)

      const { data: novoSelo, error: createError } = await supabase
        .from('selos_qualidade')
        .insert({
          profissional_id,
          tipo: 'qualidade_6m',
          data_inicio: hoje.toISOString().split('T')[0],
          data_fim: dataFim.toISOString().split('T')[0],
          media_avaliacoes: mediaAtual,
          total_avaliacoes: totalAvaliacoes,
          ativo: true
        })
        .select()
        .single()

      if (!createError && novoSelo) {
        return NextResponse.json({
          selos: [novoSelo],
          elegibilidade: {
            elegivel: true,
            mediaAtual,
            totalAvaliacoes,
            minimoNecessario: 4,
            minimoAvaliacoes: 3,
            novoSeloConquistado: true
          }
        })
      }
    }

    // Calcular próxima verificação (quando o selo atual expira)
    if (seloQualidadeAtivo) {
      proximaVerificacao = seloQualidadeAtivo.data_fim
    }

    return NextResponse.json({
      selos: selosAtivos || [],
      elegibilidade: {
        elegivel,
        mediaAtual,
        totalAvaliacoes,
        minimoNecessario: 4,
        minimoAvaliacoes: 3,
        temSeloAtivo: !!seloQualidadeAtivo,
        proximaVerificacao
      }
    })

  } catch (error) {
    console.error('Erro ao buscar selos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar selos' },
      { status: 500 }
    )
  }
}
