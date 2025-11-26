import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extrair campos do FormData
    const tipo = formData.get('tipo') as string
    const nome = formData.get('nome') as string
    const razaoSocial = formData.get('razaoSocial') as string | null
    const email = formData.get('email') as string
    const telefone = formData.get('telefone') as string
    const cpfCnpj = formData.get('cpfCnpj') as string
    const cidade = formData.get('cidade') as string
    const estado = formData.get('estado') as string
    const senha = formData.get('senha') as string
    const documento = formData.get('documento') as File | null
    const emailVerificado = formData.get('email_verificado') === 'true'

    // Validações básicas
    if (!nome || !email || !telefone || !cpfCnpj || !cidade || !estado || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (tipo === 'empresa' && !razaoSocial) {
      return NextResponse.json(
        { error: 'Razão social é obrigatória para empresas' },
        { status: 400 }
      )
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const { data: emailExists } = await supabase
      .from('profissionais')
      .select('id')
      .eq('email', email)
      .single()

    if (emailExists) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado' },
        { status: 409 }
      )
    }

    // Verificar se CPF/CNPJ já existe
    const { data: cpfCnpjExists } = await supabase
      .from('profissionais')
      .select('id')
      .eq('cpf_cnpj', cpfCnpj)
      .single()

    if (cpfCnpjExists) {
      return NextResponse.json(
        { error: 'CPF/CNPJ já cadastrado' },
        { status: 409 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    let documentoUrl: string | null = null

    // Se houver documento, fazer upload para o Supabase Storage
    if (documento && documento.size > 0) {
      try {
        const fileExt = documento.name.split('.').pop()
        const fileName = `${cpfCnpj.replace(/[^\d]/g, '')}_${Date.now()}.${fileExt}`
        const filePath = `documentos/${fileName}`

        // Converter File para ArrayBuffer
        const arrayBuffer = await documento.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profissionais-documentos')
          .upload(filePath, buffer, {
            contentType: documento.type,
            upsert: false
          })

        if (uploadError) {
          console.error('Erro ao fazer upload do documento:', uploadError)
          // Não bloqueia o cadastro se o upload falhar
        } else {
          // Gerar URL assinada (válida por 1 ano) para bucket privado
          const { data: urlData, error: urlError } = await supabase.storage
            .from('profissionais-documentos')
            .createSignedUrl(filePath, 31536000) // 365 dias em segundos

          if (!urlError && urlData) {
            documentoUrl = urlData.signedUrl
          }
        }
      } catch (uploadErr) {
        console.error('Erro no processo de upload:', uploadErr)
        // Não bloqueia o cadastro
      }
    }

    // Inserir profissional
    const { data, error } = await supabase
      .from('profissionais')
      .insert({
        tipo,
        nome,
        razao_social: razaoSocial || null,
        email,
        telefone,
        cpf_cnpj: cpfCnpj,
        cidade,
        estado,
        senha_hash: senhaHash,
        saldo_moedas: 0,
        documento_url: documentoUrl,
        aprovado: false,
        email_verificado: emailVerificado
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao cadastrar profissional:', error)
      return NextResponse.json(
        { error: 'Erro ao cadastrar profissional' },
        { status: 500 }
      )
    }

    // Remover senha_hash da resposta
    const { senha_hash, ...profissional } = data

    return NextResponse.json(
      {
        message: 'Profissional cadastrado com sucesso!',
        profissional
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Erro no cadastro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
