import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Dados recebidos:', body)

    const { id, nome, razao_social, email, telefone, cidade, estado } = body

    // Validações básicas
    if (!id || !nome || !email || !telefone || !cidade || !estado) {
      console.log('Erro de validação:', { id, nome, email, telefone, cidade, estado })
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se email já existe para outro profissional
    const { data: emailExists, error: emailError } = await supabase
      .from('profissionais')
      .select('id')
      .eq('email', email)
      .neq('id', id)

    if (emailExists && emailExists.length > 0) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado para outro usuário' },
        { status: 409 }
      )
    }

    // Atualizar profissional
    console.log('Tentando atualizar profissional com ID:', id)

    const { data, error } = await supabase
      .from('profissionais')
      .update({
        nome,
        razao_social: razao_social || null,
        email,
        telefone,
        cidade,
        estado,
      })
      .eq('id', id)
      .select()

    console.log('Resultado do update:', { data, error })

    if (error) {
      console.error('Erro ao atualizar profissional:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.log('Profissional não encontrado com ID:', id)
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    // Remover senha_hash da resposta
    const { senha_hash, ...profissional } = data[0]

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso!',
      profissional
    })

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
