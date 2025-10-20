import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do profissional é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar profissional
    const { data: profissional, error } = await supabase
      .from('profissionais')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !profissional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    // Não retornar senha_hash
    const { senha_hash, ...profissionalSemSenha } = profissional

    return NextResponse.json({
      profissional: profissionalSemSenha
    })

  } catch (error) {
    console.error('Erro ao buscar profissional:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
