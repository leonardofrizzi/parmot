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

    // Se o usuário escolheu profissional e existe como profissional, tentar primeiro
    if (tipoPreferido === 'profissional' && profissional) {
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

    // Se o usuário escolheu cliente e existe como cliente, tentar primeiro
    if (tipoPreferido === 'cliente' && cliente) {
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

    // Fallback: tentar cliente primeiro (comportamento padrão)
    if (cliente) {
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

    // Fallback: tentar profissional
    if (profissional) {
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
