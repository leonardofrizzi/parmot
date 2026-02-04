import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { CadastroClienteDTO } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body: CadastroClienteDTO = await request.json()

    // Validações básicas (telefone e endereco são opcionais para clientes)
    if (!body.nome || !body.email || !body.cep || !body.cidade || !body.estado || !body.senha) {
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

    // Capturar IP do usuário para registro do aceite dos termos
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'

    // Inserir cliente (telefone e endereco são opcionais)
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nome: body.nome,
        email: body.email,
        telefone: body.telefone || null,
        cep: body.cep,
        endereco: body.endereco || null,
        cidade: body.cidade,
        estado: body.estado,
        senha_hash: senhaHash,
        email_verificado: body.email_verificado || false,
        // Registro do aceite dos termos de uso
        termos_aceitos_em: new Date().toISOString(),
        termos_versao: '2026.1',
        termos_ip: clientIp
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao cadastrar cliente:', error)

      // Traduzir mensagens de erro do banco para português
      let mensagemErro = 'Erro ao cadastrar cliente. Tente novamente.'

      if (error.message.includes('value too long')) {
        if (error.message.includes('telefone')) {
          mensagemErro = 'Telefone inválido. Use apenas números com DDD (ex: 11999999999).'
        } else if (error.message.includes('email')) {
          mensagemErro = 'E-mail muito longo. Use um e-mail mais curto.'
        } else if (error.message.includes('nome')) {
          mensagemErro = 'Nome muito longo. Use no máximo 100 caracteres.'
        } else if (error.message.includes('cidade')) {
          mensagemErro = 'Nome da cidade muito longo. Use no máximo 100 caracteres.'
        } else {
          mensagemErro = 'Um dos campos está com valor muito grande. Verifique os dados e tente novamente.'
        }
      } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        if (error.message.includes('email')) {
          mensagemErro = 'Este e-mail já está cadastrado.'
        } else {
          mensagemErro = 'Este cadastro já existe no sistema.'
        }
      } else if (error.message.includes('not-null') || error.message.includes('null value')) {
        mensagemErro = 'Preencha todos os campos obrigatórios.'
      } else if (error.message.includes('invalid input')) {
        mensagemErro = 'Dados inválidos. Verifique os campos e tente novamente.'
      }

      return NextResponse.json(
        { error: mensagemErro },
        { status: 400 }
      )
    }

    // Verificar se já existe um profissional com o mesmo email e criar vínculo
    const { data: profissionalExistente } = await supabase
      .from('profissionais')
      .select('id')
      .eq('email', body.email)
      .single()

    if (profissionalExistente) {
      console.log('Profissional existente encontrado, criando vínculo:', profissionalExistente.id)
      // Atualizar cliente com profissional_id
      await supabase
        .from('clientes')
        .update({ profissional_id: profissionalExistente.id })
        .eq('id', data.id)

      // Atualizar profissional com cliente_id
      await supabase
        .from('profissionais')
        .update({ cliente_id: data.id })
        .eq('id', profissionalExistente.id)
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
