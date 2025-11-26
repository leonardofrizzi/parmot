import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MAX_TENTATIVAS = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, codigo, tipo = 'cadastro' } = body

    if (!email || !codigo) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar código válido mais recente
    const { data: verificacao, error: fetchError } = await supabase
      .from('verificacao_email')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('tipo', tipo)
      .eq('verificado', false)
      .gt('expira_em', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !verificacao) {
      return NextResponse.json(
        { error: 'Código expirado ou inválido. Solicite um novo código.' },
        { status: 400 }
      )
    }

    // Verificar limite de tentativas
    if (verificacao.tentativas >= MAX_TENTATIVAS) {
      return NextResponse.json(
        { error: 'Número máximo de tentativas excedido. Solicite um novo código.' },
        { status: 400 }
      )
    }

    // Verificar se o código está correto
    if (verificacao.codigo !== codigo) {
      // Incrementar tentativas
      await supabase
        .from('verificacao_email')
        .update({ tentativas: verificacao.tentativas + 1 })
        .eq('id', verificacao.id)

      const tentativasRestantes = MAX_TENTATIVAS - verificacao.tentativas - 1
      return NextResponse.json(
        {
          error: `Código incorreto. ${tentativasRestantes} tentativa(s) restante(s).`,
          tentativas_restantes: tentativasRestantes
        },
        { status: 400 }
      )
    }

    // Código correto! Marcar como verificado
    await supabase
      .from('verificacao_email')
      .update({ verificado: true })
      .eq('id', verificacao.id)

    return NextResponse.json({
      message: 'Email verificado com sucesso!',
      verificado: true
    })

  } catch (error) {
    console.error('Erro ao verificar código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
