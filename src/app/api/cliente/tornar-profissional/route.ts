import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'

// Aumentar timeout para 3 minutos devido ao upload de documentos
export const maxDuration = 180

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
    let cep: string
    let endereco: string | null
    let cidade: string
    let estado: string
    let senha: string
    let identidadeFrente: File | null = null
    let identidadeVerso: File | null = null
    let documentoEmpresa: File | null = null
    let diplomas: { frente: File; verso: File | null }[] = []

    if (contentType.includes('multipart/form-data')) {
      // FormData (com possível documento)
      const formData = await request.formData()
      cliente_id = formData.get('cliente_id') as string
      tipo = formData.get('tipo') as string
      cpf_cnpj = formData.get('cpf_cnpj') as string
      razao_social = formData.get('razao_social') as string || null
      telefone = formData.get('telefone') as string
      cep = formData.get('cep') as string || ''
      endereco = formData.get('endereco') as string || null
      cidade = formData.get('cidade') as string || ''
      estado = formData.get('estado') as string || ''
      senha = formData.get('senha') as string
      identidadeFrente = formData.get('identidadeFrente') as File | null
      identidadeVerso = formData.get('identidadeVerso') as File | null
      documentoEmpresa = formData.get('documentoEmpresa') as File | null

      // Coletar diplomas com frente e verso
      const diplomasCount = parseInt(formData.get('diplomasCount') as string || '0')
      for (let i = 0; i < diplomasCount; i++) {
        const diplomaFrente = formData.get(`diploma_${i}_frente`) as File | null
        const diplomaVerso = formData.get(`diploma_${i}_verso`) as File | null
        if (diplomaFrente && diplomaFrente.size > 0) {
          diplomas.push({ frente: diplomaFrente, verso: diplomaVerso })
        }
      }
    } else {
      // JSON (sem documento)
      const body = await request.json()
      cliente_id = body.cliente_id
      tipo = body.tipo
      cpf_cnpj = body.cpf_cnpj
      razao_social = body.razao_social || null
      telefone = body.telefone
      cep = body.cep || ''
      endereco = body.endereco || null
      cidade = body.cidade || ''
      estado = body.estado || ''
      senha = body.senha
    }

    // Validação inicial básica
    if (!cliente_id || !tipo || !cpf_cnpj || !telefone || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
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

    // Usar dados do cliente se não foram enviados
    if (!cep) cep = cliente.cep || ''
    if (!cidade) cidade = cliente.cidade || ''
    if (!estado) estado = cliente.estado || ''
    if (!endereco) endereco = cliente.endereco || null

    // Validar se temos todos os dados necessários
    if (!cep || !cidade || !estado) {
      return NextResponse.json(
        { error: 'CEP, cidade e estado são obrigatórios. Atualize seu perfil de cliente primeiro.' },
        { status: 400 }
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

    // Capturar IP do usuário para registro do aceite dos termos
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'

    // Função auxiliar para fazer upload de arquivo
    const uploadFile = async (file: File, folder: string): Promise<string | null> => {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${cpf_cnpj.replace(/[^\d]/g, '')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
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

    // Upload do documento de identidade - frente (obrigatório)
    let identidadeFrenteUrl: string | null = null
    if (identidadeFrente && identidadeFrente.size > 0) {
      const url = await uploadFile(identidadeFrente, 'identidades/frente')
      if (!url) {
        return NextResponse.json(
          { error: 'Erro ao fazer upload da frente do documento de identidade. Tente novamente.' },
          { status: 500 }
        )
      }
      identidadeFrenteUrl = url
    }

    // Upload do documento de identidade - verso (obrigatório)
    let identidadeVersoUrl: string | null = null
    if (identidadeVerso && identidadeVerso.size > 0) {
      const url = await uploadFile(identidadeVerso, 'identidades/verso')
      if (!url) {
        return NextResponse.json(
          { error: 'Erro ao fazer upload do verso do documento de identidade. Tente novamente.' },
          { status: 500 }
        )
      }
      identidadeVersoUrl = url
    }

    // Upload do documento da empresa (obrigatório para empresas)
    let documentoEmpresaUrl: string | null = null
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

    // Upload dos diplomas com frente e verso (opcional)
    const diplomaUrls: { frente: string; verso: string | null }[] = []
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
        cep,
        endereco: endereco || null,
        cidade,
        estado,
        senha_hash: senhaHash,
        saldo_moedas: 0,
        aprovado: false,
        cliente_id: cliente_id,
        identidade_frente_url: identidadeFrenteUrl,
        identidade_verso_url: identidadeVersoUrl,
        documento_empresa_url: documentoEmpresaUrl,
        diplomas_urls: diplomaUrls.length > 0 ? diplomaUrls : null,
        // Registro do aceite dos termos de uso
        termos_aceitos_em: new Date().toISOString(),
        termos_versao: '2026.1',
        termos_ip: clientIp
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
