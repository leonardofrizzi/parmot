import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { count, error } = await supabase
      .from('administradores')
      .select('*', { count: 'exact', head: true })

    if (error) {
      // Se a tabela não existir, retorna false
      if (error.code === '42P01') {
        return NextResponse.json({ exists: false })
      }
      console.error('Erro ao verificar admin:', error)
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ exists: (count || 0) > 0 })
  } catch (error) {
    console.error('Erro ao verificar admin:', error)
    return NextResponse.json({ exists: false })
  }
}
