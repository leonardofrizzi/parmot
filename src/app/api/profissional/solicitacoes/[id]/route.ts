import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const profissional_id = searchParams.get('profissional_id')

    if (!profissional_id) {
      return NextResponse.json(
        { error: 'profissional_id é obrigatório' },
        { status: 400 }
      )
    }

    // Primeiro verificar se o profissional já liberou esta solicitação
    const { data: respostaProf } = await supabase
      .from('respostas')
      .select('id')
      .eq('solicitacao_id', id)
      .eq('profissional_id', profissional_id)
      .eq('contato_liberado', true)
      .single()

    const profissionalJaLiberou = !!respostaProf

    // Buscar solicitação com informações do cliente
    // Se o profissional já liberou, não filtrar por status (pode ver mesmo se fechada)
    let query = supabase
      .from('solicitacoes')
      .select(`
        *,
        categorias:categoria_id(nome, slug, icone),
        subcategorias:subcategoria_id(nome, slug),
        clientes:cliente_id(nome, email, telefone, cidade, estado)
      `)
      .eq('id', id)

    // Se não liberou ainda, só pode ver solicitações abertas
    if (!profissionalJaLiberou) {
      query = query.eq('status', 'aberta')
    }

    const { data: solicitacaoData, error: solicitacaoError } = await query

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

    // Usar a verificação que já fizemos antes
    const jaLiberou = profissionalJaLiberou

    // Formatar dados - incluir dados do cliente apenas se já liberou
    const solicitacaoFormatada: any = {
      ...solicitacao,
      categoria_nome: solicitacao.categorias?.nome || '',
      categoria_icone: solicitacao.categorias?.icone || '',
      subcategoria_nome: solicitacao.subcategorias?.nome || '',
      cliente_cidade: solicitacao.clientes?.cidade || '',
      cliente_estado: solicitacao.clientes?.estado || ''
    }

    // Se o profissional já liberou, incluir dados de contato do cliente
    if (jaLiberou) {
      solicitacaoFormatada.cliente_nome = solicitacao.clientes?.nome || ''
      solicitacaoFormatada.cliente_email = solicitacao.clientes?.email || ''
      solicitacaoFormatada.cliente_telefone = solicitacao.clientes?.telefone || ''
      console.log('Dados do cliente incluídos:', {
        nome: solicitacaoFormatada.cliente_nome,
        email: solicitacaoFormatada.cliente_email,
        telefone: solicitacaoFormatada.cliente_telefone
      })
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
