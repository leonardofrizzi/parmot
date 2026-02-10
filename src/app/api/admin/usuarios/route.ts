import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  console.log('=== API ADMIN USUARIOS ===')
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'todos' // 'clientes', 'profissionais', 'todos'
    const filtro = searchParams.get('filtro') || 'ativos' // 'ativos', 'banidos', 'excluidos', 'todos'
    const busca = searchParams.get('busca') || ''

    console.log('Tipo:', tipo, 'Filtro:', filtro, 'Busca:', busca)

    const usuarios: any[] = []

    // Buscar clientes
    if (tipo === 'clientes' || tipo === 'todos') {
      // Primeiro tenta com colunas de banimento, se falhar tenta sem
      let clientes: any[] | null = null
      let erroClientes: any = null

      // Tentar com colunas de banimento e exclusão
      const resultadoComBanido = await supabaseAdmin
        .from('clientes')
        .select('id, nome, email, telefone, cidade, estado, banido, banido_em, motivo_banimento, excluido, excluido_em, motivo_exclusao, created_at')
        .order('created_at', { ascending: false })

      if (resultadoComBanido.error && resultadoComBanido.error.message?.includes('banido')) {
        // Coluna banido não existe, buscar sem ela
        console.log('Coluna banido não existe em clientes, buscando sem ela...')
        const resultadoSemBanido = await supabaseAdmin
          .from('clientes')
          .select('id, nome, email, telefone, cidade, estado, created_at')
          .order('created_at', { ascending: false })

        clientes = resultadoSemBanido.data
        erroClientes = resultadoSemBanido.error
      } else {
        clientes = resultadoComBanido.data
        erroClientes = resultadoComBanido.error

        // Aplicar filtros
        if (!erroClientes && clientes && filtro !== 'todos') {
          if (filtro === 'ativos') {
            clientes = clientes.filter(c => !c.banido && !c.excluido)
          } else if (filtro === 'banidos') {
            clientes = clientes.filter(c => c.banido === true)
          } else if (filtro === 'excluidos') {
            clientes = clientes.filter(c => c.excluido === true)
          }
        }
      }

      // Aplicar busca
      if (!erroClientes && clientes && busca) {
        const buscaLower = busca.toLowerCase()
        clientes = clientes.filter(c =>
          c.nome?.toLowerCase().includes(buscaLower) ||
          c.email?.toLowerCase().includes(buscaLower)
        )
      }

      if (erroClientes) {
        console.error('Erro ao buscar clientes:', erroClientes)
      } else if (clientes) {
        clientes.forEach(cliente => {
          usuarios.push({
            ...cliente,
            banido: cliente.banido || false,
            excluido: cliente.excluido || false,
            tipo_usuario: 'cliente'
          })
        })
      }
    }

    // Buscar profissionais
    if (tipo === 'profissionais' || tipo === 'todos') {
      let profissionais: any[] | null = null
      let erroProfs: any = null

      // Tentar com colunas de banimento e exclusão
      const resultadoComBanido = await supabaseAdmin
        .from('profissionais')
        .select('id, nome, email, telefone, cidade, estado, aprovado, banido, banido_em, motivo_banimento, excluido, excluido_em, motivo_exclusao, created_at')
        .order('created_at', { ascending: false })

      if (resultadoComBanido.error && resultadoComBanido.error.message?.includes('banido')) {
        // Coluna banido não existe, buscar sem ela
        console.log('Coluna banido não existe em profissionais, buscando sem ela...')
        const resultadoSemBanido = await supabaseAdmin
          .from('profissionais')
          .select('id, nome, email, telefone, cidade, estado, aprovado, created_at')
          .order('created_at', { ascending: false })

        profissionais = resultadoSemBanido.data
        erroProfs = resultadoSemBanido.error
      } else {
        profissionais = resultadoComBanido.data
        erroProfs = resultadoComBanido.error

        // Aplicar filtros
        if (!erroProfs && profissionais && filtro !== 'todos') {
          if (filtro === 'ativos') {
            profissionais = profissionais.filter(p => !p.banido && !p.excluido)
          } else if (filtro === 'banidos') {
            profissionais = profissionais.filter(p => p.banido === true)
          } else if (filtro === 'excluidos') {
            profissionais = profissionais.filter(p => p.excluido === true)
          }
        }
      }

      // Aplicar busca
      if (!erroProfs && profissionais && busca) {
        const buscaLower = busca.toLowerCase()
        profissionais = profissionais.filter(p =>
          p.nome?.toLowerCase().includes(buscaLower) ||
          p.email?.toLowerCase().includes(buscaLower)
        )
      }

      if (erroProfs) {
        console.error('Erro ao buscar profissionais:', erroProfs)
      } else if (profissionais) {
        profissionais.forEach(prof => {
          usuarios.push({
            ...prof,
            banido: prof.banido || false,
            excluido: prof.excluido || false,
            tipo_usuario: 'profissional'
          })
        })
      }
    }

    // Ordenar por data de criação (mais recentes primeiro)
    usuarios.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log('Total de usuários encontrados:', usuarios.length)

    return NextResponse.json({ usuarios })

  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
