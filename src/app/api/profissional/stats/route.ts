import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profissional_id = searchParams.get('profissional_id')

    if (!profissional_id) {
      return NextResponse.json(
        { error: 'ID do profissional é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados do profissional para saber cidade e estado
    const { data: profissional, error: profissionalError } = await supabase
      .from('profissionais')
      .select('cidade, estado')
      .eq('id', profissional_id)
      .single()

    if (profissionalError) throw profissionalError

    // Buscar categorias do profissional
    const { data: categoriasProfissional, error: categoriasError } = await supabase
      .from('profissional_categorias')
      .select('categoria_id')
      .eq('profissional_id', profissional_id)

    if (categoriasError) throw categoriasError

    const categoriaIds = categoriasProfissional?.map((c: any) => c.categoria_id) || []

    // 1. Contar solicitações disponíveis na região do profissional
    let solicitacoesQuery = supabase
      .from('solicitacoes')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'aberta')

    // Filtrar por categorias do profissional
    if (categoriaIds.length > 0) {
      solicitacoesQuery = solicitacoesQuery.in('categoria_id', categoriaIds)
    }

    // Filtrar por localização
    solicitacoesQuery = solicitacoesQuery.or(
      `cidade.eq.${profissional.cidade},atendimento_online.eq.true`
    )

    const { count: solicitacoes_disponiveis } = await solicitacoesQuery

    // 2. Contar contatos liberados este mês
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const { count: contatos_liberados } = await supabase
      .from('respostas')
      .select('id', { count: 'exact', head: true })
      .eq('profissional_id', profissional_id)
      .eq('contato_liberado', true)
      .gte('created_at', inicioMes.toISOString())

    // 3. Somar moedas gastas este mês
    const { data: transacoes, error: transacoesError } = await supabase
      .from('transacoes_moedas')
      .select('quantidade')
      .eq('profissional_id', profissional_id)
      .eq('tipo', 'gasto')
      .gte('created_at', inicioMes.toISOString())

    if (transacoesError) throw transacoesError

    const moedas_gastas = transacoes?.reduce((total: number, t: any) => {
      return total + Math.abs(t.quantidade)
    }, 0) || 0

    return NextResponse.json({
      solicitacoes_disponiveis: solicitacoes_disponiveis || 0,
      contatos_liberados: contatos_liberados || 0,
      moedas_gastas: moedas_gastas
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
