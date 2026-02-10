import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profissionalId = searchParams.get('profissional_id')
    const filtroAtivo = searchParams.get('ativo')

    let query = supabaseAdmin
      .from('selos_qualidade')
      .select('*')
      .order('created_at', { ascending: false })

    if (profissionalId) {
      query = query.eq('profissional_id', profissionalId)
    }

    if (filtroAtivo === 'true') {
      query = query.eq('ativo', true)
    } else if (filtroAtivo === 'false') {
      query = query.eq('ativo', false)
    }

    const { data: selos, error } = await query

    if (error) {
      console.error('Erro ao buscar selos:', error)
      return NextResponse.json({ error: 'Erro ao buscar selos' }, { status: 500 })
    }

    // Buscar dados adicionais para cada selo
    const selosComDados = await Promise.all(
      (selos || []).map(async (selo: Record<string, unknown>) => {
        // Nome do profissional
        const { data: prof } = await supabaseAdmin
          .from('profissionais')
          .select('nome')
          .eq('id', selo.profissional_id)
          .single()

        // Nome do tipo de selo
        let tipoSeloNome = selo.tipo || 'Selo de Qualidade'
        if (selo.tipo_selo_id) {
          const { data: tipoSelo } = await supabaseAdmin
            .from('tipos_selo')
            .select('nome, cor')
            .eq('id', selo.tipo_selo_id)
            .single()
          if (tipoSelo) {
            tipoSeloNome = tipoSelo.nome
            return {
              ...selo,
              profissional_nome: prof?.nome || 'Desconhecido',
              tipo_selo_nome: tipoSeloNome,
              tipo_selo_cor: tipoSelo.cor
            }
          }
        }

        return {
          ...selo,
          profissional_nome: prof?.nome || 'Desconhecido',
          tipo_selo_nome: tipoSeloNome,
          tipo_selo_cor: 'amber'
        }
      })
    )

    return NextResponse.json({ selos: selosComDados })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
