import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Verificar se a service role key está configurada
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY não configurada')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta. Contate o suporte.' },
        { status: 500 }
      )
    }
    // Verificar se é FormData ou JSON
    const contentType = request.headers.get('content-type') || ''

    let cliente_id: string
    let tipo: string
    let cpf_cnpj: string
    let razao_social: string | null
    let telefone: string
    let senha: string
    let documento: File | null = null

    if (contentType.includes('multipart/form-data')) {
      // FormData (com possível documento)
      const formData = await request.formData()
      cliente_id = formData.get('cliente_id') as string
      tipo = formData.get('tipo') as string
      cpf_cnpj = formData.get('cpf_cnpj') as string
      razao_social = formData.get('razao_social') as string || null
      telefone = formData.get('telefone') as string
      senha = formData.get('senha') as string
      documento = formData.get('documento') as File | null
    } else {
      // JSON (sem documento)
      const body = await request.json()
      cliente_id = body.cliente_id
      tipo = body.tipo
      cpf_cnpj = body.cpf_cnpj
      razao_social = body.razao_social || null
      telefone = body.telefone
      senha = body.senha
    }

    if (!cliente_id || !tipo || !cpf_cnpj || !telefone || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios (incluindo telefone)' },
        { status: 400 }
      )
    }

    // Buscar dados do cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', cliente_id)
      .single()

    if (clienteError || !cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já tem conta de profissional vinculada
    if (cliente.profissional_id) {
      return NextResponse.json(
        { error: 'Você já possui uma conta de profissional vinculada' },
        { status: 409 }
      )
    }

    // Verificar se CPF/CNPJ já existe
    const { data: cpfExists } = await supabase
      .from('profissionais')
      .select('id')
      .eq('cpf_cnpj', cpf_cnpj)
      .single()

    if (cpfExists) {
      return NextResponse.json(
        { error: 'CPF/CNPJ já cadastrado' },
        { status: 409 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    // Upload do documento se existir
    let documentoUrl: string | null = null
    if (documento && documento.size > 0) {
      try {
        const fileExt = documento.name.split('.').pop()
        const fileName = `${cpf_cnpj.replace(/[^\d]/g, '')}_${Date.now()}.${fileExt}`
        const filePath = `documentos/${fileName}`

        // Converter File para ArrayBuffer
        const arrayBuffer = await documento.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { error: uploadError } = await supabaseAdmin.storage
          .from('profissionais-documentos')
          .upload(filePath, buffer, {
            contentType: documento.type,
            upsert: false
          })

        if (uploadError) {
          console.error('Erro ao fazer upload do documento:', uploadError)
          return NextResponse.json(
            { error: 'Erro ao fazer upload do documento. Tente novamente.' },
            { status: 500 }
          )
        } else {
          // Gerar URL pública (bucket público)
          const { data: urlData } = supabaseAdmin.storage
            .from('profissionais-documentos')
            .getPublicUrl(filePath)

          if (urlData) {
            documentoUrl = urlData.publicUrl
          }
        }
      } catch (uploadErr) {
        console.error('Erro no processo de upload:', uploadErr)
        return NextResponse.json(
          { error: 'Erro ao processar o documento. Tente novamente.' },
          { status: 500 }
        )
      }
    }

    // Criar profissional
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .insert({
        tipo,
        nome: cliente.nome,
        razao_social: razao_social || null,
        email: cliente.email,
        telefone: telefone,
        cpf_cnpj,
        cidade: cliente.cidade,
        estado: cliente.estado,
        senha_hash: senhaHash,
        saldo_moedas: 0,
        aprovado: false,
        cliente_id: cliente_id,
        documento_url: documentoUrl
      })
      .select()
      .single()

    if (profError) {
      console.error('Erro ao criar profissional:', profError)
      return NextResponse.json(
        { error: 'Erro ao criar conta de profissional' },
        { status: 500 }
      )
    }

    // Atualizar cliente com vínculo
    await supabase
      .from('clientes')
      .update({ profissional_id: profissional.id })
      .eq('id', cliente_id)

    return NextResponse.json({
      message: 'Conta de profissional criada com sucesso! Aguarde aprovação do administrador.',
      profissional: {
        id: profissional.id,
        nome: profissional.nome,
        email: profissional.email,
        aprovado: profissional.aprovado
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar profissional:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
