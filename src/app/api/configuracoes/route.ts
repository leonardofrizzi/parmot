import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Buscar configurações públicas (valores de moedas e limites)
export async function GET() {
  try {
    const { data: config, error } = await supabase
      .from('configuracoes')
      .select('custo_contato_normal, custo_contato_exclusivo, max_profissionais_por_solicitacao, percentual_reembolso, dias_para_reembolso')
      .single()

    if (error || !config) {
      // Retorna valores padrão se não existir configuração
      return NextResponse.json({
        custo_contato_normal: 15,
        custo_contato_exclusivo: 50,
        max_profissionais_por_solicitacao: 4,
        percentual_reembolso: 30,
        dias_para_reembolso: 7
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    // Retorna valores padrão em caso de erro
    return NextResponse.json({
      custo_contato_normal: 15,
      custo_contato_exclusivo: 50,
      max_profissionais_por_solicitacao: 4,
      percentual_reembolso: 30,
      dias_para_reembolso: 7
    })
  }
}
