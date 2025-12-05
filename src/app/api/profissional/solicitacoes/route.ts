import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const cidade = searchParams.get('cidade')
    const profissional_id = searchParams.get('profissional_id')
    const atende_online = searchParams.get('atende_online') === 'true'

    if (!estado || !cidade || !profissional_id) {
      return NextResponse.json(
        { error: 'Estado, cidade e profissional_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar categorias do profissional
    const { data: categoriasProf, error: errorCat } = await supabase
      .from('profissional_categorias')
      .select('categoria_id')
      .eq('profissional_id', profissional_id)

    if (errorCat) {
      console.error('Erro ao buscar categorias do profissional:', errorCat)
      return NextResponse.json(
        { error: 'Erro ao buscar categorias' },
        { status: 500 }
      )
    }

    const categoriaIds = categoriasProf.map((c: any) => c.categoria_id)

    if (categoriaIds.length === 0) {
      // Profissional sem categorias configuradas - retornar flag especial
      return NextResponse.json({
        solicitacoes: [],
        semCategorias: true
      })
    }

    // Buscar solicitações abertas E APROVADAS das categorias do profissional
    const { data, error } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        categorias:categoria_id(nome, slug, icone),
        subcategorias:subcategoria_id(nome, slug),
        clientes:cliente_id(cidade, estado)
      `)
      .eq('status', 'aberta')
      .eq('aprovado_admin', true)
      .in('categoria_id', categoriaIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar solicitações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar solicitações' },
        { status: 500 }
      )
    }

    // Filtrar solicitações pela região
    let solicitacoesFiltradas = data.filter((solicitacao: any) => {
      // Se atende online, mostra todas as solicitações
      if (atende_online) return true

      // Senão, filtra por mesma cidade e estado
      return solicitacao.clientes?.cidade === cidade &&
             solicitacao.clientes?.estado === estado
    })

    // Verificar quais solicitações já foram liberadas pelo profissional
    const { data: respostasLiberadas } = await supabase
      .from('respostas')
      .select('solicitacao_id')
      .eq('profissional_id', profissional_id)
      .eq('contato_liberado', true)

    const solicitacoesLiberadas = new Set(
      respostasLiberadas?.map((r: any) => r.solicitacao_id) || []
    )

    // Contar quantos profissionais liberaram cada solicitação
    const { data: todasRespostas } = await supabase
      .from('respostas')
      .select('solicitacao_id')
      .eq('contato_liberado', true)
      .in('solicitacao_id', solicitacoesFiltradas.map((s: any) => s.id))

    const contadorLiberacoes: Record<string, number> = {}
    todasRespostas?.forEach((r: any) => {
      contadorLiberacoes[r.solicitacao_id] = (contadorLiberacoes[r.solicitacao_id] || 0) + 1
    })

    // Formatar dados com informações de liberação
    const solicitacoesFormatadas = solicitacoesFiltradas.map((solicitacao: any) => ({
      ...solicitacao,
      categoria_nome: solicitacao.categorias?.nome || '',
      categoria_icone: solicitacao.categorias?.icone || '',
      subcategoria_nome: solicitacao.subcategorias?.nome || '',
      cliente_cidade: solicitacao.clientes?.cidade || '',
      cliente_estado: solicitacao.clientes?.estado || '',
      ja_liberou: solicitacoesLiberadas.has(solicitacao.id),
      total_liberacoes: contadorLiberacoes[solicitacao.id] || 0,
      vagas_disponiveis: Math.max(0, 4 - (contadorLiberacoes[solicitacao.id] || 0))
    }))

    return NextResponse.json({
      solicitacoes: solicitacoesFormatadas
    })

  } catch (error) {
    console.error('Erro ao listar solicitações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
