import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Tipos de documento suportados
type TipoDocumento = 'identidade' | 'empresa' | 'diploma' | 'foto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const profissional_id = formData.get('profissional_id') as string
    const documento = formData.get('documento') as File | null
    const tipo_documento = (formData.get('tipo_documento') as TipoDocumento) || 'identidade'

    if (!profissional_id) {
      return NextResponse.json(
        { error: 'ID do profissional é obrigatório' },
        { status: 400 }
      )
    }

    if (!documento || documento.size === 0) {
      return NextResponse.json(
        { error: 'Documento é obrigatório' },
        { status: 400 }
      )
    }

    // Validar tamanho (max 5MB)
    if (documento.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'O arquivo deve ter no máximo 5MB' },
        { status: 400 }
      )
    }

    // Validar tipo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(documento.type)) {
      return NextResponse.json(
        { error: 'Apenas arquivos PDF, JPG ou PNG são permitidos' },
        { status: 400 }
      )
    }

    // Para foto, validar que é imagem
    if (tipo_documento === 'foto') {
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!imageTypes.includes(documento.type)) {
        return NextResponse.json(
          { error: 'Foto deve ser JPG, PNG ou WebP' },
          { status: 400 }
        )
      }
    }

    // Verificar se profissional existe
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select('id, cpf_cnpj, documento_url, documento_empresa_url, diplomas_urls, foto_url')
      .eq('id', profissional_id)
      .single()

    if (profError || !profissional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    // Determinar a pasta e campo baseado no tipo de documento
    let folder: string
    let fieldName: string
    let oldUrl: string | null = null

    switch (tipo_documento) {
      case 'empresa':
        folder = 'empresas'
        fieldName = 'documento_empresa_url'
        oldUrl = profissional.documento_empresa_url
        break
      case 'diploma':
        folder = 'diplomas'
        fieldName = 'diplomas_urls'
        // Para diplomas, não deletamos o antigo (são múltiplos)
        break
      case 'foto':
        folder = 'fotos'
        fieldName = 'foto_url'
        oldUrl = profissional.foto_url
        break
      default: // 'identidade'
        folder = 'identidades'
        fieldName = 'documento_url'
        oldUrl = profissional.documento_url
    }

    // Se não é diploma e já tem documento, deletar o antigo
    if (tipo_documento !== 'diploma' && oldUrl) {
      try {
        const urlObj = new URL(oldUrl)
        const pathParts = urlObj.pathname.split('/storage/v1/object/public/profissionais-documentos/')
        if (pathParts[1]) {
          await supabaseAdmin.storage
            .from('profissionais-documentos')
            .remove([pathParts[1]])
        }
      } catch (e) {
        console.error('Erro ao deletar documento antigo:', e)
      }
    }

    // Upload do novo documento
    const fileExt = documento.name.split('.').pop()
    const cpfLimpo = profissional.cpf_cnpj.replace(/[^\d]/g, '')
    const fileName = `${cpfLimpo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const arrayBuffer = await documento.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('profissionais-documentos')
      .upload(filePath, buffer, {
        contentType: documento.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao fazer upload do documento' },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('profissionais-documentos')
      .getPublicUrl(filePath)

    const documentoUrl = urlData.publicUrl

    // Atualizar profissional com a nova URL
    let updateData: Record<string, unknown>

    if (tipo_documento === 'diploma') {
      // Para diplomas, adiciona ao array existente
      const currentDiplomas = profissional.diplomas_urls || []
      updateData = { diplomas_urls: [...currentDiplomas, documentoUrl] }
    } else {
      updateData = { [fieldName]: documentoUrl }
    }

    const { error: updateError } = await supabase
      .from('profissionais')
      .update(updateData)
      .eq('id', profissional_id)

    if (updateError) {
      console.error('Erro ao atualizar profissional:', updateError)
      return NextResponse.json(
        { error: 'Erro ao salvar URL do documento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Documento enviado com sucesso',
      documento_url: documentoUrl,
      tipo_documento
    })

  } catch (error) {
    console.error('Erro ao fazer upload de documento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE para remover um diploma específico
export async function DELETE(request: NextRequest) {
  try {
    const { profissional_id, diploma_url } = await request.json()

    if (!profissional_id || !diploma_url) {
      return NextResponse.json(
        { error: 'ID do profissional e URL do diploma são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se profissional existe
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select('id, diplomas_urls')
      .eq('id', profissional_id)
      .single()

    if (profError || !profissional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    // Remover URL do array
    const currentDiplomas = profissional.diplomas_urls || []
    const updatedDiplomas = currentDiplomas.filter((url: string) => url !== diploma_url)

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('profissionais')
      .update({ diplomas_urls: updatedDiplomas.length > 0 ? updatedDiplomas : null })
      .eq('id', profissional_id)

    if (updateError) {
      console.error('Erro ao atualizar profissional:', updateError)
      return NextResponse.json(
        { error: 'Erro ao remover diploma' },
        { status: 500 }
      )
    }

    // Tentar deletar o arquivo do storage
    try {
      const urlObj = new URL(diploma_url)
      const pathParts = urlObj.pathname.split('/storage/v1/object/public/profissionais-documentos/')
      if (pathParts[1]) {
        await supabaseAdmin.storage
          .from('profissionais-documentos')
          .remove([pathParts[1]])
      }
    } catch (e) {
      console.error('Erro ao deletar arquivo:', e)
    }

    return NextResponse.json({
      message: 'Diploma removido com sucesso',
      diplomas_urls: updatedDiplomas
    })

  } catch (error) {
    console.error('Erro ao remover diploma:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
