import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profissional_id, senha } = body

    if (!profissional_id || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar dados do profissional
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select('*')
      .eq('id', profissional_id)
      .single()

    if (profError || !profissional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já tem conta de cliente vinculada
    if (profissional.cliente_id) {
      return NextResponse.json(
        { error: 'Você já possui uma conta de cliente vinculada' },
        { status: 409 }
      )
    }

    // Verificar se email já existe como cliente
    const { data: emailExists } = await supabase
      .from('clientes')
      .select('id')
      .eq('email', profissional.email)
      .single()

    if (emailExists) {
      // Se já existe, apenas vincular
      await supabase
        .from('profissionais')
        .update({ cliente_id: emailExists.id })
        .eq('id', profissional_id)

      await supabase
        .from('clientes')
        .update({ profissional_id: profissional_id })
        .eq('id', emailExists.id)

      return NextResponse.json({
        message: 'Conta de cliente vinculada com sucesso!',
        cliente: {
          id: emailExists.id
        }
      })
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    // Criar cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .insert({
        nome: profissional.nome,
        email: profissional.email,
        telefone: profissional.telefone,
        cidade: profissional.cidade,
        estado: profissional.estado,
        senha_hash: senhaHash,
        profissional_id: profissional_id // Vínculo com profissional
      })
      .select()
      .single()

    if (clienteError) {
      console.error('Erro ao criar cliente:', clienteError)
      return NextResponse.json(
        { error: 'Erro ao criar conta de cliente' },
        { status: 500 }
      )
    }

    // Atualizar profissional com vínculo
    await supabase
      .from('profissionais')
      .update({ cliente_id: cliente.id })
      .eq('id', profissional_id)

    return NextResponse.json({
      message: 'Conta de cliente criada com sucesso!',
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
