import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  console.log('=== LOGIN ADMIN ===')
  try {
    const { email, senha } = await request.json()
    console.log('Email tentando login:', email)

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar admin por email (usando supabaseAdmin para ignorar RLS)
    // Não filtra por 'ativo' para garantir compatibilidade se a coluna não existir
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('administradores')
      .select('*')
      .eq('email', email)
      .single()

    console.log('Admin encontrado:', admin ? 'SIM' : 'NÃO')
    console.log('Erro na busca:', adminError?.message || 'nenhum')

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Verificar senha com bcrypt
    const senhaValida = await bcrypt.compare(senha, admin.senha_hash)

    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Retornar dados do admin (sem o hash da senha)
    const { senha_hash, ...adminSemSenha } = admin

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      admin: adminSemSenha
    })

  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    )
  }
}
