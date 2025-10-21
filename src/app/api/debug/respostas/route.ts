import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Buscar TODAS as respostas
    const { data, error } = await supabase
      .from('respostas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({
      total: data.length,
      respostas: data
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
