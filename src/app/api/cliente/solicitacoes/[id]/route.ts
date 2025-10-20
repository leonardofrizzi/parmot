import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID da solicitação é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar solicitação com detalhes
    const { data: solicitacao, error } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        categorias:categoria_id(nome, slug, icone),
        subcategorias:subcategoria_id(nome, slug),
        clientes:cliente_id(nome, email, telefone, cidade, estado)
      `)
      .eq('id', id)
      .single()

    if (error || !solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    // Buscar profissionais que liberaram o contato
    const { data: respostas, error: errorRespostas } = await supabase
      .from('respostas')
      .select(`
        id,
        created_at,
        exclusivo,
        contato_liberado,
        profissionais:profissional_id(
          id,
          nome,
          email,
          telefone,
          cidade,
          estado,
          tipo,
          razao_social
        )
      `)
      .eq('solicitacao_id', id)
      .eq('contato_liberado', true)
      .order('created_at', { ascending: false })

    if (errorRespostas) {
      console.error('Erro ao buscar respostas:', errorRespostas)
    }

    // Formatar dados
    const profissionaisInteressados = respostas?.map((resposta: any) => ({
      resposta_id: resposta.id,
      data_liberacao: resposta.created_at,
      exclusivo: resposta.exclusivo,
      profissional: resposta.profissionais
    })) || []

    const solicitacaoFormatada = {
      ...solicitacao,
      categoria_nome: solicitacao.categorias?.nome || '',
      categoria_icone: solicitacao.categorias?.icone || '',
      subcategoria_nome: solicitacao.subcategorias?.nome || '',
      cliente: solicitacao.clientes,
      profissionais_interessados: profissionaisInteressados,
      total_profissionais: profissionaisInteressados.length,
      tem_exclusivo: profissionaisInteressados.some((p: any) => p.exclusivo)
    }

    return NextResponse.json({
      solicitacao: solicitacaoFormatada
    })

  } catch (error) {
    console.error('Erro ao buscar solicitação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
