import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profissional_id = searchParams.get('profissional_id')

    if (!profissional_id) {
      return NextResponse.json(
        { error: 'profissional_id é obrigatório' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('profissionais')
      .select('saldo_moedas')
      .eq('id', profissional_id)
      .single()

    if (error) {
      console.error('Erro ao buscar saldo:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar saldo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      saldo: data?.saldo_moedas || 0
    })

  } catch (error) {
    console.error('Erro ao buscar saldo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
