import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const profissional_id = searchParams.get('profissional_id')

    if (!profissional_id) {
      return NextResponse.json(
        { error: 'profissional_id é obrigatório' },
        { status: 400 }
      )
    }

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
      .eq('status', 'aberta')

    if (solicitacaoError) {
      console.error('Erro ao buscar solicitação:', solicitacaoError)
      return NextResponse.json(
        { error: 'Erro ao buscar solicitação' },
        { status: 500 }
      )
    }

    if (!solicitacaoData || solicitacaoData.length === 0) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada ou não está mais disponível' },
        { status: 404 }
      )
    }

    const solicitacao = solicitacaoData[0]

    // Buscar respostas (profissionais que liberaram contato)
    const { data: respostasData, error: respostasError } = await supabase
      .from('respostas')
      .select(`
        id,
        profissional_id,
        contato_liberado,
        created_at,
        profissionais:profissional_id(nome)
      `)
      .eq('solicitacao_id', id)
      .eq('contato_liberado', true)

    if (respostasError) {
      console.error('Erro ao buscar respostas:', respostasError)
    }

    // Verificar se este profissional já liberou
    const jaLiberou = respostasData?.some((r: any) => r.profissional_id === profissional_id) || false

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
      id: resposta.id,
      profissional_id: resposta.profissional_id,
      profissional_nome: resposta.profissionais?.nome || 'Profissional',
      contato_liberado: resposta.contato_liberado,
      created_at: resposta.created_at
    }))

    return NextResponse.json({
      solicitacao: solicitacaoFormatada,
      respostas: respostasFormatadas,
      ja_liberou: jaLiberou
    })

  } catch (error) {
    console.error('Erro ao buscar detalhes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
