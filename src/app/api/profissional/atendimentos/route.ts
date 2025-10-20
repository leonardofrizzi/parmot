import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profissional_id = searchParams.get('profissional_id')

    if (!profissional_id) {
      return NextResponse.json(
        { error: 'profissional_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar todas as respostas/contatos liberados pelo profissional
    const { data: respostas, error } = await supabase
      .from('respostas')
      .select(`
        id,
        solicitacao_id,
        contato_liberado,
        exclusivo,
        created_at,
        solicitacoes:solicitacao_id (
          id,
          titulo,
          descricao,
          status,
          created_at,
          categoria_id,
          subcategoria_id,
          cliente_id,
          categorias:categoria_id(nome, slug, icone),
          subcategorias:subcategoria_id(nome, slug),
          clientes:cliente_id(nome, email, telefone, cidade, estado)
        )
      `)
      .eq('profissional_id', profissional_id)
      .eq('contato_liberado', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar atendimentos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar atendimentos' },
        { status: 500 }
      )
    }

    // Formatar os dados
    const atendimentosFormatados = respostas.map((resposta: any) => {
      const solicitacao = resposta.solicitacoes

      return {
        resposta_id: resposta.id,
        solicitacao_id: resposta.solicitacao_id,
        exclusivo: resposta.exclusivo,
        data_liberacao: resposta.created_at,

        // Dados da solicitação
        titulo: solicitacao?.titulo || '',
        descricao: solicitacao?.descricao || '',
        status: solicitacao?.status || '',
        data_solicitacao: solicitacao?.created_at || '',

        // Categoria
        categoria_nome: solicitacao?.categorias?.nome || '',
        categoria_icone: solicitacao?.categorias?.icone || '',
        subcategoria_nome: solicitacao?.subcategorias?.nome || '',

        // Dados do cliente (agora liberados)
        cliente_nome: solicitacao?.clientes?.nome || '',
        cliente_email: solicitacao?.clientes?.email || '',
        cliente_telefone: solicitacao?.clientes?.telefone || '',
        cliente_cidade: solicitacao?.clientes?.cidade || '',
        cliente_estado: solicitacao?.clientes?.estado || '',
      }
    })

    return NextResponse.json({
      atendimentos: atendimentosFormatados
    })

  } catch (error) {
    console.error('Erro ao listar atendimentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
