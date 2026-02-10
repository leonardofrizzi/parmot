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
    const { data: selosAtivosRaw, error: selosError } = await supabase
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

    // Selos são agora atribuídos manualmente pela admin
    // Buscar info dos tipos de selo
    const selosAtivos = await Promise.all(
      (selosAtivosRaw || []).map(async (selo: any) => {
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

    // Calcular próxima verificação (quando o selo mais recente expira)
    const seloMaisRecente = selosAtivos?.[0]
    if (seloMaisRecente) {
      proximaVerificacao = seloMaisRecente.data_fim
    }

    return NextResponse.json({
      selos: selosAtivos,
      elegibilidade: {
        elegivel,
        mediaAtual,
        totalAvaliacoes,
        minimoNecessario: 4,
        minimoAvaliacoes: 3,
        temSeloAtivo: selosAtivos.length > 0,
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
