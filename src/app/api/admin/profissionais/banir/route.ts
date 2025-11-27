import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(request: NextRequest) {
  console.log('=== API BANIR PROFISSIONAL ===')
  try {
    const { profissional_id, banido, motivo } = await request.json()

    if (!profissional_id) {
      return NextResponse.json(
        { error: 'profissional_id é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Profissional ID:', profissional_id)
    console.log('Banir:', banido)
    console.log('Motivo:', motivo || 'não informado')

    // Atualizar status de banimento
    const updateData: any = {
      banido: banido,
      banido_em: banido ? new Date().toISOString() : null,
      motivo_banimento: banido ? (motivo || 'Comportamento não ético') : null
    }

    // Se for banir, também remove aprovação
    if (banido) {
      updateData.aprovado = false
    }

    const { data, error } = await supabaseAdmin
      .from('profissionais')
      .update(updateData)
      .eq('id', profissional_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao banir profissional:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar status do profissional' },
        { status: 500 }
      )
    }

    console.log('Profissional atualizado:', data.nome, '- Banido:', data.banido)

    return NextResponse.json({
      message: banido ? 'Profissional banido com sucesso' : 'Banimento removido com sucesso',
      profissional: data
    })

  } catch (error) {
    console.error('Erro ao processar banimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
