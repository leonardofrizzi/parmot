import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, codigo, novaSenha } = body

    if (!email || !codigo || !novaSenha) {
      return NextResponse.json(
        { error: 'Email, código e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se o código está válido e verificado
    const { data: verificacao, error: fetchError } = await supabaseAdmin
      .from('verificacao_email')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('tipo', 'recuperacao')
      .eq('codigo', codigo)
      .eq('verificado', true)
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !verificacao) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado. Solicite um novo código.' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 10)

    // Tentar atualizar em clientes
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .update({ senha_hash: senhaHash })
      .eq('email', email.toLowerCase())
      .select('id')
      .single()

    // Tentar atualizar em profissionais
    const { data: profissional, error: profissionalError } = await supabaseAdmin
      .from('profissionais')
      .update({ senha_hash: senhaHash })
      .eq('email', email.toLowerCase())
      .select('id')
      .single()

    // Verificar se atualizou em alguma tabela
    if (!cliente && !profissional) {
      return NextResponse.json(
        { error: 'Email não encontrado no sistema' },
        { status: 404 }
      )
    }

    // Invalidar o código usado (deletar para evitar reuso)
    await supabaseAdmin
      .from('verificacao_email')
      .delete()
      .eq('id', verificacao.id)

    return NextResponse.json({
      message: 'Senha alterada com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao trocar senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
