import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { admin_id, email } = await request.json()

    if (!admin_id || !email) {
      return NextResponse.json(
        { valid: false, error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Verificar se o admin existe e está ativo
    const { data: admin, error } = await supabaseAdmin
      .from('administradores')
      .select('id, email, nome')
      .eq('id', admin_id)
      .eq('email', email)
      .single()

    if (error || !admin) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ valid: true, admin })

  } catch (error) {
    console.error('Erro ao validar admin:', error)
    return NextResponse.json({ valid: false })
  }
}
