import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  try {
    const { id, senhaAtual, novaSenha } = await request.json()

    // Validações básicas
    if (!id || !senhaAtual || !novaSenha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Buscar cliente
    const { data: cliente, error: fetchError } = await supabase
      .from('clientes')
      .select('senha_hash')
      .eq('id', id)
      .single()

    if (fetchError || !cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar senha atual
    const senhaCorreta = await bcrypt.compare(senhaAtual, cliente.senha_hash)

    if (!senhaCorreta) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 401 }
      )
    }

    // Hash da nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10)

    // Atualizar senha
    const { error: updateError } = await supabase
      .from('clientes')
      .update({
        senha_hash: novaSenhaHash,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      return NextResponse.json(
        { error: 'Erro ao redefinir senha' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Senha alterada com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
