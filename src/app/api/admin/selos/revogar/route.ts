import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(request: NextRequest) {
  try {
    const { selo_id } = await request.json()

    if (!selo_id) {
      return NextResponse.json({ error: 'selo_id é obrigatório.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('selos_qualidade')
      .update({ ativo: false })
      .eq('id', selo_id)

    if (error) {
      console.error('Erro ao revogar selo:', error)
      return NextResponse.json({ error: 'Erro ao revogar selo.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Selo revogado com sucesso.' })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
