import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Total de profissionais
    const { count: total_profissionais } = await supabase
      .from('profissionais')
      .select('*', { count: 'exact', head: true })

    // Profissionais pendentes de aprovação
    const { count: profissionais_pendentes } = await supabase
      .from('profissionais')
      .select('*', { count: 'exact', head: true })
      .eq('aprovado', false)

    // Profissionais ativos (aprovados)
    const { count: profissionais_ativos } = await supabase
      .from('profissionais')
      .select('*', { count: 'exact', head: true })
      .eq('aprovado', true)

    // Total de solicitações
    const { count: total_solicitacoes } = await supabase
      .from('solicitacoes')
      .select('*', { count: 'exact', head: true })

    // Solicitações abertas
    const { count: solicitacoes_abertas } = await supabase
      .from('solicitacoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aberta')

    // Solicitações finalizadas
    const { count: solicitacoes_finalizadas } = await supabase
      .from('solicitacoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'finalizada')

    // Total de reembolsos
    const { count: total_reembolsos } = await supabase
      .from('solicitacoes_reembolso')
      .select('*', { count: 'exact', head: true })

    // Reembolsos pendentes
    const { count: reembolsos_pendentes } = await supabase
      .from('solicitacoes_reembolso')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')

    // Reembolsos aprovados
    const { count: reembolsos_aprovados } = await supabase
      .from('solicitacoes_reembolso')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aprovado')

    // Reembolsos negados
    const { count: reembolsos_negados } = await supabase
      .from('solicitacoes_reembolso')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'negado')

    return NextResponse.json({
      stats: {
        total_profissionais: total_profissionais || 0,
        profissionais_pendentes: profissionais_pendentes || 0,
        profissionais_ativos: profissionais_ativos || 0,
        total_solicitacoes: total_solicitacoes || 0,
        solicitacoes_abertas: solicitacoes_abertas || 0,
        solicitacoes_finalizadas: solicitacoes_finalizadas || 0,
        total_reembolsos: total_reembolsos || 0,
        reembolsos_pendentes: reembolsos_pendentes || 0,
        reembolsos_aprovados: reembolsos_aprovados || 0,
        reembolsos_negados: reembolsos_negados || 0,
      }
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
