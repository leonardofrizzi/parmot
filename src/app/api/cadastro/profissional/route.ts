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
    const documentoIdentidade = formData.get('documentoIdentidade') as File | null
    const documentoEmpresa = formData.get('documentoEmpresa') as File | null
    const diplomasCount = parseInt(formData.get('diplomasCount') as string || '0')
    const emailVerificado = formData.get('email_verificado') === 'true'

    // Coletar diplomas
    const diplomas: File[] = []
    for (let i = 0; i < diplomasCount; i++) {
      const diploma = formData.get(`diploma_${i}`) as File | null
      if (diploma && diploma.size > 0) {
        diplomas.push(diploma)
      }
    }

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
    let documentoEmpresaUrl: string | null = null
    const diplomaUrls: string[] = []

    // Função auxiliar para fazer upload de arquivo
    const uploadFile = async (file: File, folder: string): Promise<string | null> => {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${cpfCnpj.replace(/[^\d]/g, '')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `${folder}/${fileName}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { error: uploadError } = await supabaseAdmin.storage
          .from('profissionais-documentos')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError) {
          console.error('Erro ao fazer upload:', uploadError)
          return null
        }

        const { data: urlData } = supabaseAdmin.storage
          .from('profissionais-documentos')
          .getPublicUrl(filePath)

        return urlData?.publicUrl || null
      } catch (err) {
        console.error('Erro no upload:', err)
        return null
      }
    }

    // Upload do documento de identidade pessoal (obrigatório)
    if (documentoIdentidade && documentoIdentidade.size > 0) {
      const url = await uploadFile(documentoIdentidade, 'identidades')
      if (!url) {
        return NextResponse.json(
          { error: 'Erro ao fazer upload do documento de identidade. Tente novamente.' },
          { status: 500 }
        )
      }
      documentoUrl = url
    }

    // Upload do documento da empresa (obrigatório para empresas)
    if (documentoEmpresa && documentoEmpresa.size > 0) {
      const url = await uploadFile(documentoEmpresa, 'empresas')
      if (!url) {
        return NextResponse.json(
          { error: 'Erro ao fazer upload do documento da empresa. Tente novamente.' },
          { status: 500 }
        )
      }
      documentoEmpresaUrl = url
    }

    // Upload dos diplomas (opcional)
    for (const diploma of diplomas) {
      const url = await uploadFile(diploma, 'diplomas')
      if (url) {
        diplomaUrls.push(url)
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
        documento_empresa_url: documentoEmpresaUrl,
        diplomas_urls: diplomaUrls.length > 0 ? diplomaUrls : null,
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
