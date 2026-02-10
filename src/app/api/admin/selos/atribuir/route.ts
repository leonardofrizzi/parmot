import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { profissional_id, tipo_selo_id, motivo, admin_id } = await request.json()

    if (!profissional_id || !tipo_selo_id) {
      return NextResponse.json(
        { error: 'Dados incompletos. Informe profissional_id e tipo_selo_id.' },
        { status: 400 }
      )
    }

    // Datas automáticas: início hoje, fim em 100 anos (sem expiração, admin remove manualmente)
    const data_inicio = new Date().toISOString().split('T')[0]
    const data_fim = '2099-12-31'

    // Verificar profissional
    const { data: prof, error: profError } = await supabaseAdmin
      .from('profissionais')
      .select('id, nome, aprovado')
      .eq('id', profissional_id)
      .single()

    if (profError || !prof) {
      return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 })
    }

    // Verificar tipo de selo
    const { data: tipoSelo, error: tipoError } = await supabaseAdmin
      .from('tipos_selo')
      .select('id, nome')
      .eq('id', tipo_selo_id)
      .eq('ativo', true)
      .single()

    if (tipoError || !tipoSelo) {
      return NextResponse.json({ error: 'Tipo de selo não encontrado ou inativo.' }, { status: 404 })
    }

    // Buscar estatísticas atuais de avaliações
    const { data: avaliacoes } = await supabaseAdmin
      .from('avaliacoes')
      .select('nota')
      .eq('profissional_id', profissional_id)

    const totalAvaliacoes = avaliacoes?.length || 0
    const mediaAvaliacoes = totalAvaliacoes > 0
      ? avaliacoes!.reduce((sum: number, a: { nota: number }) => sum + a.nota, 0) / totalAvaliacoes
      : 0

    // Criar selo
    const { data: selo, error: insertError } = await supabaseAdmin
      .from('selos_qualidade')
      .insert({
        profissional_id,
        tipo: tipoSelo.nome,
        tipo_selo_id,
        data_inicio,
        data_fim,
        media_avaliacoes: parseFloat(mediaAvaliacoes.toFixed(1)),
        total_avaliacoes: totalAvaliacoes,
        ativo: true,
        admin_id: admin_id || null,
        motivo: motivo || null,
        atribuido_manualmente: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao atribuir selo:', insertError)
      return NextResponse.json({ error: 'Erro ao atribuir selo.' }, { status: 500 })
    }

    return NextResponse.json({
      selo,
      message: `Selo "${tipoSelo.nome}" atribuído com sucesso para ${prof.nome}!`
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
