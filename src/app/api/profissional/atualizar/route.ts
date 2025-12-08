import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Função para gerar slug a partir do nome
function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
    .substring(0, 80) // Limita o tamanho
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Dados recebidos:', body)

    const { id, nome, razao_social, email, telefone, cep, endereco, cidade, estado, sobre, slug: slugCustom, atende_online } = body

    // Validações básicas
    if (!id || !nome || !email || !telefone || !cidade || !estado) {
      console.log('Erro de validação:', { id, nome, email, telefone, cidade, estado })
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se email já existe para outro profissional
    const { data: emailExists, error: emailError } = await supabase
      .from('profissionais')
      .select('id')
      .eq('email', email)
      .neq('id', id)

    if (emailExists && emailExists.length > 0) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado para outro usuário' },
        { status: 409 }
      )
    }

    // Gerar slug se não tiver ou se o nome mudou
    let slugFinal = slugCustom
    if (!slugFinal) {
      // Buscar profissional atual para ver se já tem slug
      const { data: profAtual } = await supabase
        .from('profissionais')
        .select('slug, nome')
        .eq('id', id)
        .single()

      // Gerar slug se não tiver ou se o nome mudou
      if (!profAtual?.slug || profAtual.nome !== nome) {
        let baseSlug = gerarSlug(nome)
        let slug = baseSlug
        let contador = 1

        // Verificar se slug já existe para outro profissional
        while (true) {
          const { data: slugExists } = await supabase
            .from('profissionais')
            .select('id')
            .eq('slug', slug)
            .neq('id', id)

          if (!slugExists || slugExists.length === 0) break

          slug = `${baseSlug}-${contador}`
          contador++
        }

        slugFinal = slug
      } else {
        slugFinal = profAtual.slug
      }
    }

    // Atualizar profissional
    console.log('Tentando atualizar profissional com ID:', id)

    const { data, error } = await supabaseAdmin
      .from('profissionais')
      .update({
        nome,
        razao_social: razao_social || null,
        email,
        telefone,
        cep: cep ? cep.replace(/\D/g, '') : null,
        endereco: endereco || null,
        cidade,
        estado,
        sobre: sobre || null,
        slug: slugFinal,
        atende_online: atende_online || false,
      })
      .eq('id', id)
      .select()

    console.log('Resultado do update:', { data, error })

    if (error) {
      console.error('Erro ao atualizar profissional:', error)
      return NextResponse.json(
        { error: `Erro ao atualizar perfil: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.log('Profissional não encontrado com ID:', id)
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    // Remover senha_hash da resposta
    const { senha_hash, ...profissional } = data[0]

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso!',
      profissional
    })

  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error)
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error?.message || 'desconhecido'}` },
      { status: 500 }
    )
  }
}
