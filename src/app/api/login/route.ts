import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, senha, tipoPreferido } = await request.json()

    // Validações básicas
    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar em ambas as tabelas
    const { data: cliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', email)
      .single()

    const { data: profissional } = await supabase
      .from('profissionais')
      .select('*')
      .eq('email', email)
      .single()

    // Se o usuário escolheu profissional, tentar APENAS como profissional
    if (tipoPreferido === 'profissional') {
      if (!profissional) {
        return NextResponse.json(
          { error: 'Não existe conta de profissional com este email' },
          { status: 401 }
        )
      }

      if (profissional.excluido) {
        return NextResponse.json(
          { error: 'Esta conta foi excluída' },
          { status: 401 }
        )
      }

      const senhaCorreta = await bcrypt.compare(senha, profissional.senha_hash)

      if (!senhaCorreta) {
        return NextResponse.json(
          { error: 'Senha incorreta' },
          { status: 401 }
        )
      }

      const { senha_hash, ...profissionalData } = profissional

      return NextResponse.json({
        tipo: 'profissional',
        usuario: profissionalData,
        redirectTo: '/dashboard/profissional'
      })
    }

    // Se o usuário escolheu cliente, tentar APENAS como cliente
    if (tipoPreferido === 'cliente') {
      if (!cliente) {
        return NextResponse.json(
          { error: 'Não existe conta de cliente com este email' },
          { status: 401 }
        )
      }

      if (cliente.excluido) {
        return NextResponse.json(
          { error: 'Esta conta foi excluída' },
          { status: 401 }
        )
      }

      const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash)

      if (!senhaCorreta) {
        return NextResponse.json(
          { error: 'Senha incorreta' },
          { status: 401 }
        )
      }

      const { senha_hash, ...clienteData } = cliente

      return NextResponse.json({
        tipo: 'cliente',
        usuario: clienteData,
        redirectTo: '/dashboard/cliente'
      })
    }

    // Sem tipo preferido: tentar cliente primeiro (comportamento padrão)
    if (cliente && !cliente.excluido) {
      const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash)

      if (senhaCorreta) {
        const { senha_hash, ...clienteData } = cliente

        return NextResponse.json({
          tipo: 'cliente',
          usuario: clienteData,
          redirectTo: '/dashboard/cliente'
        })
      }
    }

    // Sem tipo preferido: tentar profissional
    if (profissional && !profissional.excluido) {
      const senhaCorreta = await bcrypt.compare(senha, profissional.senha_hash)

      if (senhaCorreta) {
        const { senha_hash, ...profissionalData } = profissional

        return NextResponse.json({
          tipo: 'profissional',
          usuario: profissionalData,
          redirectTo: '/dashboard/profissional'
        })
      }
    }

    // Email não encontrado ou senha incorreta
    return NextResponse.json(
      { error: 'Email ou senha incorretos' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
