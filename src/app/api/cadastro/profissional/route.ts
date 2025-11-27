import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  console.log('=== INÍCIO CADASTRO PROFISSIONAL ===')

  try {
    // Verificar se a service role key está configurada
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('ERRO: SUPABASE_SERVICE_ROLE_KEY não configurada')
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta. Contate o suporte.' },
        { status: 500 }
      )
    }
    console.log('✓ SUPABASE_SERVICE_ROLE_KEY configurada')

    const formData = await request.formData()
    console.log('✓ FormData recebido')

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
    // Documento de identidade - frente e verso
    const identidadeFrente = formData.get('identidadeFrente') as File | null
    const identidadeVerso = formData.get('identidadeVerso') as File | null
    const documentoEmpresa = formData.get('documentoEmpresa') as File | null
    const diplomasCount = parseInt(formData.get('diplomasCount') as string || '0')
    const emailVerificado = formData.get('email_verificado') === 'true'

    // Coletar diplomas (frente e verso)
    const diplomas: { frente: File; verso: File | null }[] = []
    for (let i = 0; i < diplomasCount; i++) {
      const diplomaFrente = formData.get(`diploma_${i}_frente`) as File | null
      const diplomaVerso = formData.get(`diploma_${i}_verso`) as File | null
      if (diplomaFrente && diplomaFrente.size > 0) {
        diplomas.push({ frente: diplomaFrente, verso: diplomaVerso })
      }
    }

    console.log('Dados recebidos:', { tipo, nome, email, telefone, cpfCnpj: cpfCnpj?.substring(0, 4) + '***', cidade, estado, emailVerificado })

    // Validações básicas
    if (!nome || !email || !telefone || !cpfCnpj || !cidade || !estado || !senha) {
      console.error('ERRO: Campos obrigatórios faltando:', { nome: !!nome, email: !!email, telefone: !!telefone, cpfCnpj: !!cpfCnpj, cidade: !!cidade, estado: !!estado, senha: !!senha })
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }
    console.log('✓ Validações básicas OK')

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
    console.log('Verificando se email existe...')
    const { data: emailExists, error: emailError } = await supabase
      .from('profissionais')
      .select('id')
      .eq('email', email)
      .single()

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('ERRO ao verificar email:', emailError)
    }

    if (emailExists) {
      console.log('ERRO: Email já existe')
      return NextResponse.json(
        { error: 'E-mail já cadastrado' },
        { status: 409 }
      )
    }
    console.log('✓ Email disponível')

    // Verificar se CPF/CNPJ já existe
    console.log('Verificando se CPF/CNPJ existe...')
    const { data: cpfCnpjExists, error: cpfError } = await supabase
      .from('profissionais')
      .select('id')
      .eq('cpf_cnpj', cpfCnpj)
      .single()

    if (cpfError && cpfError.code !== 'PGRST116') {
      console.error('ERRO ao verificar CPF/CNPJ:', cpfError)
    }

    if (cpfCnpjExists) {
      console.log('ERRO: CPF/CNPJ já existe')
      return NextResponse.json(
        { error: 'CPF/CNPJ já cadastrado' },
        { status: 409 }
      )
    }
    console.log('✓ CPF/CNPJ disponível')

    // Hash da senha
    console.log('Gerando hash da senha...')
    const senhaHash = await bcrypt.hash(senha, 10)
    console.log('✓ Hash gerado')

    let identidadeFrenteUrl: string | null = null
    let identidadeVersoUrl: string | null = null
    let documentoEmpresaUrl: string | null = null
    const diplomaUrls: { frente: string; verso: string | null }[] = []

    // Função auxiliar para fazer upload de arquivo
    const uploadFile = async (file: File, folder: string): Promise<string | null> => {
      console.log(`Upload iniciado: ${file.name} (${file.size} bytes) -> ${folder}`)
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${cpfCnpj.replace(/[^\d]/g, '')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `${folder}/${fileName}`
        console.log(`Caminho do arquivo: ${filePath}`)

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log(`Buffer criado: ${buffer.length} bytes`)

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('profissionais-documentos')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError) {
          console.error('ERRO UPLOAD:', uploadError.message)
          console.error('ERRO UPLOAD detalhes:', JSON.stringify(uploadError))
          return null
        }
        console.log('Upload bem sucedido:', uploadData)

        const { data: urlData } = supabaseAdmin.storage
          .from('profissionais-documentos')
          .getPublicUrl(filePath)

        console.log('URL pública:', urlData?.publicUrl)
        return urlData?.publicUrl || null
      } catch (err) {
        console.error('ERRO CATCH upload:', err)
        return null
      }
    }

    // Upload do documento de identidade - frente (obrigatório)
    console.log('Iniciando uploads de documentos...')
    if (identidadeFrente && identidadeFrente.size > 0) {
      console.log('Fazendo upload da identidade frente...')
      const url = await uploadFile(identidadeFrente, 'identidades/frente')
      if (!url) {
        console.error('ERRO: Falha no upload da identidade frente')
        return NextResponse.json(
          { error: 'Erro ao fazer upload da frente do documento de identidade. Tente novamente.' },
          { status: 500 }
        )
      }
      identidadeFrenteUrl = url
      console.log('✓ Identidade frente uploaded')
    }

    // Upload do documento de identidade - verso (obrigatório)
    if (identidadeVerso && identidadeVerso.size > 0) {
      console.log('Fazendo upload da identidade verso...')
      const url = await uploadFile(identidadeVerso, 'identidades/verso')
      if (!url) {
        console.error('ERRO: Falha no upload da identidade verso')
        return NextResponse.json(
          { error: 'Erro ao fazer upload do verso do documento de identidade. Tente novamente.' },
          { status: 500 }
        )
      }
      identidadeVersoUrl = url
      console.log('✓ Identidade verso uploaded')
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

    // Upload dos diplomas - frente e verso (opcional)
    for (const diploma of diplomas) {
      const frenteUrl = await uploadFile(diploma.frente, 'diplomas/frente')
      if (frenteUrl) {
        let versoUrl: string | null = null
        if (diploma.verso && diploma.verso.size > 0) {
          versoUrl = await uploadFile(diploma.verso, 'diplomas/verso')
        }
        diplomaUrls.push({ frente: frenteUrl, verso: versoUrl })
      }
    }

    // Inserir profissional
    console.log('Inserindo profissional no banco...')
    const insertData = {
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
      // Documento de identidade - frente e verso
      identidade_frente_url: identidadeFrenteUrl,
      identidade_verso_url: identidadeVersoUrl,
      documento_empresa_url: documentoEmpresaUrl,
      // Diplomas com frente e verso
      diplomas_urls: diplomaUrls.length > 0 ? diplomaUrls : null,
      aprovado: false,
      email_verificado: emailVerificado
    }
    console.log('Dados a inserir:', { ...insertData, senha_hash: '***' })

    const { data, error } = await supabase
      .from('profissionais')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('ERRO ao inserir profissional:', error)
      console.error('Código do erro:', error.code)
      console.error('Detalhes:', error.details)
      console.error('Hint:', error.hint)
      return NextResponse.json(
        { error: `Erro ao cadastrar profissional: ${error.message}` },
        { status: 500 }
      )
    }
    console.log('✓ Profissional inserido com sucesso:', data.id)

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
    console.error('=== ERRO FATAL NO CADASTRO ===')
    console.error('Tipo:', typeof error)
    console.error('Erro:', error)
    if (error instanceof Error) {
      console.error('Mensagem:', error.message)
      console.error('Stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
