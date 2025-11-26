import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const profissional_id = formData.get('profissional_id') as string
    const documento = formData.get('documento') as File | null

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

    // Verificar se profissional existe
    const { data: profissional, error: profError } = await supabase
      .from('profissionais')
      .select('id, documento_url')
      .eq('id', profissional_id)
      .single()

    if (profError || !profissional) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    // Se já tem documento, deletar o antigo
    if (profissional.documento_url) {
      try {
        // Extrair o path do documento antigo
        const oldUrl = new URL(profissional.documento_url)
        const pathParts = oldUrl.pathname.split('/storage/v1/object/public/profissionais/')
        if (pathParts[1]) {
          await supabase.storage
            .from('profissionais')
            .remove([pathParts[1]])
        }
      } catch (e) {
        // Ignora erros ao deletar arquivo antigo
        console.error('Erro ao deletar documento antigo:', e)
      }
    }

    // Upload do novo documento
    const fileExt = documento.name.split('.').pop()
    const fileName = `${profissional_id}_${Date.now()}.${fileExt}`
    const filePath = `documentos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profissionais')
      .upload(filePath, documento, {
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
    const { data: urlData } = supabase.storage
      .from('profissionais')
      .getPublicUrl(filePath)

    const documentoUrl = urlData.publicUrl

    // Atualizar profissional com a nova URL
    const { error: updateError } = await supabase
      .from('profissionais')
      .update({ documento_url: documentoUrl })
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
      documento_url: documentoUrl
    })

  } catch (error) {
    console.error('Erro ao fazer upload de documento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
