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
        negocio_fechado,
        created_at
      `)
      .eq('profissional_id', profissional_id)
      .eq('contato_liberado', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar respostas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar respostas' },
        { status: 500 }
      )
    }

    // Buscar detalhes de cada solicitação
    const atendimentosComDetalhes = await Promise.all(
      respostas.map(async (resposta: any) => {
        const { data: solicitacao } = await supabase
          .from('solicitacoes')
          .select(`
            id,
            titulo,
            descricao,
            status,
            created_at,
            categoria_id,
            subcategoria_id,
            cliente_id,
            profissional_contratado_id
          `)
          .eq('id', resposta.solicitacao_id)
          .single()

        const { data: categoria } = await supabase
          .from('categorias')
          .select('nome, icone')
          .eq('id', solicitacao?.categoria_id)
          .single()

        const { data: subcategoria } = await supabase
          .from('subcategorias')
          .select('nome')
          .eq('id', solicitacao?.subcategoria_id)
          .single()

        const { data: cliente } = await supabase
          .from('clientes')
          .select('nome, email, telefone, cidade, estado')
          .eq('id', solicitacao?.cliente_id)
          .single()

        // Verificar se existe solicitação de reembolso para esta resposta
        const { data: reembolso } = await supabase
          .from('solicitacoes_reembolso')
          .select('id, status')
          .eq('resposta_id', resposta.id)
          .single()

        return {
          resposta,
          solicitacao,
          categoria,
          subcategoria,
          cliente,
          reembolso
        }
      })
    )

    // Formatar os dados
    const atendimentosFormatados = atendimentosComDetalhes.map((item: any) => {
      return {
        resposta_id: item.resposta.id,
        solicitacao_id: item.resposta.solicitacao_id,
        exclusivo: item.resposta.exclusivo,
        data_liberacao: item.resposta.created_at,

        // Dados da solicitação
        titulo: item.solicitacao?.titulo || '',
        descricao: item.solicitacao?.descricao || '',
        status: item.solicitacao?.status || '',
        data_solicitacao: item.solicitacao?.created_at || '',

        // Categoria
        categoria_nome: item.categoria?.nome || '',
        categoria_icone: item.categoria?.icone || '',
        subcategoria_nome: item.subcategoria?.nome || '',

        // Dados do cliente (agora liberados)
        cliente_nome: item.cliente?.nome || '',
        cliente_email: item.cliente?.email || '',
        cliente_telefone: item.cliente?.telefone || '',
        cliente_cidade: item.cliente?.cidade || '',
        cliente_estado: item.cliente?.estado || '',

        // Quem fechou o negócio (do lado do profissional)
        negocio_fechado: item.resposta.negocio_fechado || false,
        // Quem o cliente selecionou como contratado
        profissional_contratado_id: item.solicitacao?.profissional_contratado_id || null,

        // Dados de reembolso
        tem_reembolso: !!item.reembolso,
        reembolso_status: item.reembolso?.status || null,
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
