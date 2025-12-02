import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Buscar configurações atuais
export async function GET() {
  try {
    const { data: config, error } = await supabase
      .from('configuracoes')
      .select('*')
      .single()

    if (error || !config) {
      // Retorna valores padrão se não existir configuração
      return NextResponse.json({
        custo_contato_normal: 15,
        custo_contato_exclusivo: 50,
        max_profissionais_por_solicitacao: 4,
        percentual_reembolso: 30,
        dias_para_reembolso: 7,
        // Pacotes de moedas
        pacote1_moedas: 250,
        pacote1_preco: 25,
        pacote2_moedas: 500,
        pacote2_preco: 45,
        pacote3_moedas: 1000,
        pacote3_preco: 80
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar configurações
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      custo_contato_normal,
      custo_contato_exclusivo,
      max_profissionais_por_solicitacao,
      percentual_reembolso,
      dias_para_reembolso,
      // Pacotes de moedas
      pacote1_moedas,
      pacote1_preco,
      pacote2_moedas,
      pacote2_preco,
      pacote3_moedas,
      pacote3_preco
    } = body

    // Validações
    if (custo_contato_normal !== undefined && (custo_contato_normal < 1 || custo_contato_normal > 1000)) {
      return NextResponse.json(
        { error: 'Custo do contato normal deve estar entre 1 e 1000 moedas' },
        { status: 400 }
      )
    }

    if (custo_contato_exclusivo !== undefined && (custo_contato_exclusivo < 1 || custo_contato_exclusivo > 1000)) {
      return NextResponse.json(
        { error: 'Custo do contato exclusivo deve estar entre 1 e 1000 moedas' },
        { status: 400 }
      )
    }

    if (max_profissionais_por_solicitacao !== undefined && (max_profissionais_por_solicitacao < 1 || max_profissionais_por_solicitacao > 20)) {
      return NextResponse.json(
        { error: 'Máximo de profissionais deve estar entre 1 e 20' },
        { status: 400 }
      )
    }

    if (percentual_reembolso !== undefined && (percentual_reembolso < 0 || percentual_reembolso > 100)) {
      return NextResponse.json(
        { error: 'Percentual de reembolso deve estar entre 0 e 100' },
        { status: 400 }
      )
    }

    if (dias_para_reembolso !== undefined && (dias_para_reembolso < 1 || dias_para_reembolso > 30)) {
      return NextResponse.json(
        { error: 'Dias para reembolso deve estar entre 1 e 30' },
        { status: 400 }
      )
    }

    // Verificar se já existe configuração
    const { data: existingConfig } = await supabase
      .from('configuracoes')
      .select('id')
      .single()

    const updateData: Record<string, number> = {}
    if (custo_contato_normal !== undefined) updateData.custo_contato_normal = custo_contato_normal
    if (custo_contato_exclusivo !== undefined) updateData.custo_contato_exclusivo = custo_contato_exclusivo
    if (max_profissionais_por_solicitacao !== undefined) updateData.max_profissionais_por_solicitacao = max_profissionais_por_solicitacao
    if (percentual_reembolso !== undefined) updateData.percentual_reembolso = percentual_reembolso
    if (dias_para_reembolso !== undefined) updateData.dias_para_reembolso = dias_para_reembolso
    // Pacotes de moedas
    if (pacote1_moedas !== undefined) updateData.pacote1_moedas = pacote1_moedas
    if (pacote1_preco !== undefined) updateData.pacote1_preco = pacote1_preco
    if (pacote2_moedas !== undefined) updateData.pacote2_moedas = pacote2_moedas
    if (pacote2_preco !== undefined) updateData.pacote2_preco = pacote2_preco
    if (pacote3_moedas !== undefined) updateData.pacote3_moedas = pacote3_moedas
    if (pacote3_preco !== undefined) updateData.pacote3_preco = pacote3_preco

    let result
    if (existingConfig) {
      // Atualizar
      result = await supabase
        .from('configuracoes')
        .update(updateData)
        .eq('id', existingConfig.id)
        .select()
        .single()
    } else {
      // Criar com valores padrão + atualizações
      result = await supabase
        .from('configuracoes')
        .insert({
          custo_contato_normal: custo_contato_normal ?? 15,
          custo_contato_exclusivo: custo_contato_exclusivo ?? 50,
          max_profissionais_por_solicitacao: max_profissionais_por_solicitacao ?? 4,
          percentual_reembolso: percentual_reembolso ?? 30,
          dias_para_reembolso: dias_para_reembolso ?? 7,
          pacote1_moedas: pacote1_moedas ?? 250,
          pacote1_preco: pacote1_preco ?? 25,
          pacote2_moedas: pacote2_moedas ?? 500,
          pacote2_preco: pacote2_preco ?? 45,
          pacote3_moedas: pacote3_moedas ?? 1000,
          pacote3_preco: pacote3_preco ?? 80
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Erro ao atualizar configurações:', result.error)
      return NextResponse.json(
        { error: 'Erro ao salvar configurações' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Configurações atualizadas com sucesso',
      config: result.data
    })

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
