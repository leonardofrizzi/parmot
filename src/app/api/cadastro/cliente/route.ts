import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { CadastroClienteDTO } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body: CadastroClienteDTO = await request.json()

    // Validações básicas (telefone é opcional para clientes)
    if (!body.nome || !body.email || !body.cidade || !body.estado || !body.senha) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios' },
        { status: 400 }
      )
    }

    if (body.senha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const { data: emailExists } = await supabase
      .from('clientes')
      .select('id')
      .eq('email', body.email)
      .single()

    if (emailExists) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado' },
        { status: 409 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(body.senha, 10)

    // Inserir cliente (telefone é opcional)
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nome: body.nome,
        email: body.email,
        telefone: body.telefone || null,
        cidade: body.cidade,
        estado: body.estado,
        senha_hash: senhaHash,
        email_verificado: body.email_verificado || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao cadastrar cliente:', error)
      return NextResponse.json(
        { error: 'Erro ao cadastrar cliente' },
        { status: 500 }
      )
    }

    // Remover senha_hash da resposta
    const { senha_hash, ...cliente } = data

    return NextResponse.json(
      {
        message: 'Cliente cadastrado com sucesso!',
        cliente
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erro no cadastro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
