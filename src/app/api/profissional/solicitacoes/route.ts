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

    // Buscar TODAS as solicitações abertas e aprovadas (só tem 1 categoria)
    // Inclui nome, email, telefone e CEP do cliente para mostrar quando liberado
    const { data, error } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        categorias:categoria_id(nome, slug, icone),
        subcategorias:subcategoria_id(nome, slug),
        clientes:cliente_id(nome, email, telefone, cep, cidade, estado)
      `)
      .eq('status', 'aberta')
      .eq('aprovado_admin', true)
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
    // Inclui resposta_id para permitir solicitar reembolso
    const { data: respostasLiberadas } = await supabase
      .from('respostas')
      .select('id, solicitacao_id, exclusivo')
      .eq('profissional_id', profissional_id)
      .eq('contato_liberado', true)

    const respostasPorSolicitacao = new Map(
      respostasLiberadas?.map((r: any) => [r.solicitacao_id, { resposta_id: r.id, exclusivo: r.exclusivo }]) || []
    )
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
    const solicitacoesFormatadas = solicitacoesFiltradas.map((solicitacao: any) => {
      const jaLiberou = solicitacoesLiberadas.has(solicitacao.id)

      const dados: any = {
        ...solicitacao,
        categoria_nome: solicitacao.categorias?.nome || '',
        categoria_icone: solicitacao.categorias?.icone || '',
        subcategoria_nome: solicitacao.subcategorias?.nome || '',
        cliente_cep: solicitacao.clientes?.cep || '',
        cliente_cidade: solicitacao.clientes?.cidade || '',
        cliente_estado: solicitacao.clientes?.estado || '',
        ja_liberou: jaLiberou,
        total_liberacoes: contadorLiberacoes[solicitacao.id] || 0,
        vagas_disponiveis: Math.max(0, 4 - (contadorLiberacoes[solicitacao.id] || 0))
      }

      // Se já liberou, incluir dados de contato do cliente e da resposta (para reembolso)
      if (jaLiberou) {
        const respostaInfo = respostasPorSolicitacao.get(solicitacao.id)
        dados.cliente_nome = solicitacao.clientes?.nome || ''
        dados.cliente_email = solicitacao.clientes?.email || ''
        dados.cliente_telefone = solicitacao.clientes?.telefone || ''
        dados.resposta_id = respostaInfo?.resposta_id || null
        dados.exclusivo = respostaInfo?.exclusivo || false
      }

      return dados
    })

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
