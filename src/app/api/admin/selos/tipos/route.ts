import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data: tipos, error } = await supabaseAdmin
      .from('tipos_selo')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar tipos de selo:', error)
      return NextResponse.json({ error: 'Erro ao buscar tipos de selo' }, { status: 500 })
    }

    return NextResponse.json({ tipos: tipos || [] })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, descricao, cor } = await request.json()

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const { data: tipo, error } = await supabaseAdmin
      .from('tipos_selo')
      .insert({
        nome,
        descricao: descricao || null,
        cor: cor || 'amber'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar tipo de selo:', error)
      return NextResponse.json({ error: 'Erro ao criar tipo de selo' }, { status: 500 })
    }

    return NextResponse.json({ tipo, message: `Tipo de selo "${nome}" criado com sucesso!` })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
