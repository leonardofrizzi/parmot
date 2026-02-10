import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { usuario_id, tipo_usuario, senha, motivo } = await request.json()

    if (!usuario_id || !tipo_usuario || !senha) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (!['cliente', 'profissional'].includes(tipo_usuario)) {
      return NextResponse.json(
        { error: 'Tipo de usuário inválido' },
        { status: 400 }
      )
    }

    const tabela = tipo_usuario === 'cliente' ? 'clientes' : 'profissionais'

    // Buscar usuário para verificar senha
    const { data: usuario, error: fetchError } = await supabaseAdmin
      .from(tabela)
      .select('id, senha_hash')
      .eq('id', usuario_id)
      .single()

    if (fetchError || !usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash)
    if (!senhaCorreta) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      )
    }

    // Soft delete
    const { error: updateError } = await supabaseAdmin
      .from(tabela)
      .update({
        excluido: true,
        excluido_em: new Date().toISOString(),
        motivo_exclusao: motivo || 'Exclusão solicitada pelo usuário'
      })
      .eq('id', usuario_id)

    if (updateError) {
      console.error('Erro ao excluir conta:', updateError)
      return NextResponse.json(
        { error: 'Erro ao excluir conta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Conta excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar exclusão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
