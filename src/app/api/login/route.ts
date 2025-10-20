import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json()

    // Validações básicas
    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar em clientes
    const { data: cliente } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', email)
      .single()

    if (cliente) {
      // Verificar senha
      const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash)

      if (!senhaCorreta) {
        return NextResponse.json(
          { error: 'Email ou senha incorretos' },
          { status: 401 }
        )
      }

      // Login bem-sucedido como cliente
      const { senha_hash, ...clienteData } = cliente

      return NextResponse.json({
        tipo: 'cliente',
        usuario: clienteData,
        redirectTo: '/dashboard/cliente'
      })
    }

    // Buscar em profissionais
    const { data: profissional } = await supabase
      .from('profissionais')
      .select('*')
      .eq('email', email)
      .single()

    if (profissional) {
      // Verificar senha
      const senhaCorreta = await bcrypt.compare(senha, profissional.senha_hash)

      if (!senhaCorreta) {
        return NextResponse.json(
          { error: 'Email ou senha incorretos' },
          { status: 401 }
        )
      }

      // Login bem-sucedido como profissional
      const { senha_hash, ...profissionalData } = profissional

      return NextResponse.json({
        tipo: 'profissional',
        usuario: profissionalData,
        redirectTo: '/dashboard/profissional'
      })
    }

    // Email não encontrado
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
