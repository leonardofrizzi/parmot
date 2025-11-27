import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  console.log('=== API ADMIN USUARIOS ===')
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'todos' // 'clientes', 'profissionais', 'todos'
    const filtro = searchParams.get('filtro') || 'ativos' // 'ativos', 'banidos', 'todos'
    const busca = searchParams.get('busca') || ''

    console.log('Tipo:', tipo, 'Filtro:', filtro, 'Busca:', busca)

    const usuarios: any[] = []

    // Buscar clientes
    if (tipo === 'clientes' || tipo === 'todos') {
      let queryClientes = supabaseAdmin
        .from('clientes')
        .select('id, nome, email, telefone, cidade, estado, banido, banido_em, motivo_banimento, created_at')
        .order('created_at', { ascending: false })

      // Filtro de banimento
      if (filtro === 'ativos') {
        queryClientes = queryClientes.or('banido.is.null,banido.eq.false')
      } else if (filtro === 'banidos') {
        queryClientes = queryClientes.eq('banido', true)
      }

      // Busca por nome ou email
      if (busca) {
        queryClientes = queryClientes.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`)
      }

      const { data: clientes, error: erroClientes } = await queryClientes

      if (erroClientes) {
        console.error('Erro ao buscar clientes:', erroClientes)
      } else if (clientes) {
        clientes.forEach(cliente => {
          usuarios.push({
            ...cliente,
            tipo_usuario: 'cliente'
          })
        })
      }
    }

    // Buscar profissionais
    if (tipo === 'profissionais' || tipo === 'todos') {
      let queryProfs = supabaseAdmin
        .from('profissionais')
        .select('id, nome, email, telefone, cidade, estado, aprovado, banido, banido_em, motivo_banimento, created_at')
        .order('created_at', { ascending: false })

      // Filtro de banimento
      if (filtro === 'ativos') {
        queryProfs = queryProfs.or('banido.is.null,banido.eq.false')
      } else if (filtro === 'banidos') {
        queryProfs = queryProfs.eq('banido', true)
      }

      // Busca por nome ou email
      if (busca) {
        queryProfs = queryProfs.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`)
      }

      const { data: profissionais, error: erroProfs } = await queryProfs

      if (erroProfs) {
        console.error('Erro ao buscar profissionais:', erroProfs)
      } else if (profissionais) {
        profissionais.forEach(prof => {
          usuarios.push({
            ...prof,
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
