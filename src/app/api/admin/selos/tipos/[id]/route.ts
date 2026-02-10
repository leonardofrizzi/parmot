import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.nome !== undefined) updateData.nome = body.nome
    if (body.descricao !== undefined) updateData.descricao = body.descricao
    if (body.cor !== undefined) updateData.cor = body.cor
    if (body.ativo !== undefined) updateData.ativo = body.ativo

    const { error } = await supabaseAdmin
      .from('tipos_selo')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar tipo de selo:', error)
      return NextResponse.json({ error: 'Erro ao atualizar tipo de selo' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Tipo de selo atualizado com sucesso' })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verificar se há selos usando este tipo
    const { data: selosUsando } = await supabaseAdmin
      .from('selos_qualidade')
      .select('id')
      .eq('tipo_selo_id', id)
      .eq('ativo', true)
      .limit(1)

    if (selosUsando && selosUsando.length > 0) {
      // Desativar ao invés de deletar
      await supabaseAdmin
        .from('tipos_selo')
        .update({ ativo: false })
        .eq('id', id)

      return NextResponse.json({ message: 'Tipo de selo desativado (há selos ativos usando este tipo)' })
    }

    const { error } = await supabaseAdmin
      .from('tipos_selo')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar tipo de selo:', error)
      return NextResponse.json({ error: 'Erro ao deletar tipo de selo' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Tipo de selo removido com sucesso' })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
