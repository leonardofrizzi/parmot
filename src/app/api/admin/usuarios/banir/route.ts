import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(request: NextRequest) {
  console.log('=== API BANIR USUARIO ===')
  try {
    const { usuario_id, tipo_usuario, banido, motivo } = await request.json()

    if (!usuario_id || !tipo_usuario) {
      return NextResponse.json(
        { error: 'usuario_id e tipo_usuario são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['cliente', 'profissional'].includes(tipo_usuario)) {
      return NextResponse.json(
        { error: 'tipo_usuario deve ser "cliente" ou "profissional"' },
        { status: 400 }
      )
    }

    console.log('Usuario ID:', usuario_id)
    console.log('Tipo:', tipo_usuario)
    console.log('Banir:', banido)
    console.log('Motivo:', motivo || 'não informado')

    const tabela = tipo_usuario === 'cliente' ? 'clientes' : 'profissionais'

    // Atualizar status de banimento
    const updateData: any = {
      banido: banido,
      banido_em: banido ? new Date().toISOString() : null,
      motivo_banimento: banido ? (motivo || 'Comportamento inadequado') : null
    }

    // Se for profissional e estiver banindo, também remove aprovação
    if (tipo_usuario === 'profissional' && banido) {
      updateData.aprovado = false
    }

    const { data, error } = await supabaseAdmin
      .from(tabela)
      .update(updateData)
      .eq('id', usuario_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao banir usuário:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar status do usuário' },
        { status: 500 }
      )
    }

    console.log('Usuário atualizado:', data.nome, '- Banido:', data.banido)

    return NextResponse.json({
      message: banido ? 'Usuário banido com sucesso' : 'Banimento removido com sucesso',
      usuario: data
    })

  } catch (error) {
    console.error('Erro ao processar banimento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
