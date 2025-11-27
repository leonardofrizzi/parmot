import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, email, senha } = body

    // Validações
    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (senha.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se já existe um admin
    const { count } = await supabaseAdmin
      .from('administradores')
      .select('*', { count: 'exact', head: true })

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: 'Já existe um administrador cadastrado' },
        { status: 409 }
      )
    }

    // Verificar se email já existe
    const { data: emailExists } = await supabaseAdmin
      .from('administradores')
      .select('id')
      .eq('email', email)
      .single()

    if (emailExists) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado' },
        { status: 409 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    // Inserir admin
    const { data, error } = await supabaseAdmin
      .from('administradores')
      .insert({
        nome,
        email,
        senha_hash: senhaHash,
        ativo: true
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar admin:', error)
      return NextResponse.json(
        { error: 'Erro ao criar administrador' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Administrador criado com sucesso!',
      admin: {
        id: data.id,
        nome: data.nome,
        email: data.email
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
