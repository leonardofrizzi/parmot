import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Buscar solicitação com informações do cliente
    const { data: solicitacaoData, error: solicitacaoError } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        categorias:categoria_id(nome, slug, icone),
        subcategorias:subcategoria_id(nome, slug),
        clientes:cliente_id(cidade, estado)
      `)
      .eq('id', id)

    if (solicitacaoError) {
      console.error('Erro ao buscar solicitação:', solicitacaoError)
      return NextResponse.json(
        { error: 'Erro ao buscar solicitação' },
        { status: 500 }
      )
    }

    if (!solicitacaoData || solicitacaoData.length === 0) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    const solicitacao = solicitacaoData[0]

    // Buscar apenas respostas com contato liberado
    const { data: respostasData, error: respostasError } = await supabase
      .from('respostas')
      .select(`
        *,
        profissionais:profissional_id(nome, telefone, email)
      `)
      .eq('solicitacao_id', id)
      .eq('contato_liberado', true)
      .order('created_at', { ascending: true })

    if (respostasError) {
      console.error('Erro ao buscar respostas:', respostasError)
    }

    // Formatar dados
    const solicitacaoFormatada = {
      ...solicitacao,
      categoria_nome: solicitacao.categorias?.nome || '',
      categoria_icone: solicitacao.categorias?.icone || '',
      subcategoria_nome: solicitacao.subcategorias?.nome || '',
      cliente_cidade: solicitacao.clientes?.cidade || '',
      cliente_estado: solicitacao.clientes?.estado || ''
    }

    const respostasFormatadas = (respostasData || []).map((resposta: any) => ({
      ...resposta,
      profissional_nome: resposta.profissionais?.nome || '',
      profissional_telefone: resposta.profissionais?.telefone || '',
      profissional_email: resposta.profissionais?.email || ''
    }))

    return NextResponse.json({
      solicitacao: solicitacaoFormatada,
      respostas: respostasFormatadas
    })

  } catch (error) {
    console.error('Erro ao buscar detalhes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
