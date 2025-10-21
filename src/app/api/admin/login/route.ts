import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json()

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar admin por email
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Por enquanto, validação simples (em produção usar bcrypt)
    // Senha padrão: admin123
    if (senha !== 'admin123') {
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
