import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const checks = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    resend_api_key: !!process.env.RESEND_API_KEY,
    resend_from_email: !!process.env.RESEND_FROM_EMAIL,
    tabela_verificacao_email: false,
    tabela_profissionais: false,
    bucket_documentos: false
  }

  // Testar conexão com Supabase
  try {
    const { error: verifError } = await supabase
      .from('verificacao_email')
      .select('id')
      .limit(1)
    checks.tabela_verificacao_email = !verifError
  } catch {
    checks.tabela_verificacao_email = false
  }

  try {
    const { error: profError } = await supabase
      .from('profissionais')
      .select('id')
      .limit(1)
    checks.tabela_profissionais = !profError
  } catch {
    checks.tabela_profissionais = false
  }

  // Testar bucket de storage
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('profissionais-documentos')
      .list('', { limit: 1 })
    checks.bucket_documentos = !error
  } catch {
    checks.bucket_documentos = false
  }

  const allGood = Object.values(checks).every(v => v === true)

  return NextResponse.json({
    status: allGood ? 'ok' : 'problemas_encontrados',
    checks,
    timestamp: new Date().toISOString()
  })
}
