import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { CadastroProfissionalDTO } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body: CadastroProfissionalDTO = await request.json()

    // Validações básicas
    if (!body.nome || !body.email || !body.telefone || !body.cpfCnpj || !body.cidade || !body.estado || !body.senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (body.tipo === 'empresa' && !body.razaoSocial) {
      return NextResponse.json(
        { error: 'Razão social é obrigatória para empresas' },
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
      .from('profissionais')
      .select('id')
      .eq('email', body.email)
      .single()

    if (emailExists) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado' },
        { status: 409 }
      )
    }

    // Verificar se CPF/CNPJ já existe
    const { data: cpfCnpjExists } = await supabase
      .from('profissionais')
      .select('id')
      .eq('cpf_cnpj', body.cpfCnpj)
      .single()

    if (cpfCnpjExists) {
      return NextResponse.json(
        { error: 'CPF/CNPJ já cadastrado' },
        { status: 409 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(body.senha, 10)

    // Inserir profissional
    const { data, error } = await supabase
      .from('profissionais')
      .insert({
        tipo: body.tipo,
        nome: body.nome,
        razao_social: body.razaoSocial || null,
        email: body.email,
        telefone: body.telefone,
        cpf_cnpj: body.cpfCnpj,
        cidade: body.cidade,
        estado: body.estado,
        senha_hash: senhaHash,
        saldo_moedas: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao cadastrar profissional:', error)
      return NextResponse.json(
        { error: 'Erro ao cadastrar profissional' },
        { status: 500 }
      )
    }

    // Remover senha_hash da resposta
    const { senha_hash, ...profissional } = data

    return NextResponse.json(
      {
        message: 'Profissional cadastrado com sucesso!',
        profissional
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
