import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(request: NextRequest) {
  try {
    const { usuario_id, tipo_usuario } = await request.json()

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

    const tabela = tipo_usuario === 'cliente' ? 'clientes' : 'profissionais'

    const { data, error } = await supabaseAdmin
      .from(tabela)
      .update({
        excluido: false,
        excluido_em: null,
        motivo_exclusao: null
      })
      .eq('id', usuario_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao restaurar conta:', error)
      return NextResponse.json(
        { error: 'Erro ao restaurar conta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Conta restaurada com sucesso',
      usuario: data
    })

  } catch (error) {
    console.error('Erro ao processar restauração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
