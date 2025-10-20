import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SolicitacaoDTO } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente_id, titulo, descricao, categoria_id, subcategoria_id } = body as SolicitacaoDTO & { cliente_id: string }

    // Validações
    if (!cliente_id || !titulo || !descricao || !categoria_id || !subcategoria_id) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar solicitação
    const { data, error } = await supabase
      .from('solicitacoes')
      .insert({
        cliente_id,
        titulo,
        descricao,
        categoria_id,
        subcategoria_id,
        status: 'aberta'
      })
      .select()

    if (error) {
      console.error('Erro ao criar solicitação:', error)
      return NextResponse.json(
        { error: 'Erro ao criar solicitação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Solicitação criada com sucesso!',
      solicitacao: data[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar solicitação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Listar solicitações de um cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cliente_id = searchParams.get('cliente_id')

    if (!cliente_id) {
      return NextResponse.json(
        { error: 'cliente_id é obrigatório' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        categorias:categoria_id(nome, slug, icone),
        subcategorias:subcategoria_id(nome, slug),
        respostas(count)
      `)
      .eq('cliente_id', cliente_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar solicitações:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar solicitações' },
        { status: 500 }
      )
    }

    // Formatar dados
    const solicitacoesFormatadas = data.map((solicitacao: any) => ({
      ...solicitacao,
      categoria_nome: solicitacao.categorias?.nome || '',
      categoria_icone: solicitacao.categorias?.icone || '',
      subcategoria_nome: solicitacao.subcategorias?.nome || '',
      respostas_count: solicitacao.respostas?.[0]?.count || 0
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
