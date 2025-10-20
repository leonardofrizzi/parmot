const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas!')
  process.exit(1)
}

async function createTables() {
  console.log('🚀 Criando tabelas no Supabase...')
  console.log('\n⚠️  IMPORTANTE: Execute o SQL manualmente no Supabase SQL Editor')
  console.log('📍 Acesse: https://supabase.com/dashboard/project/vnnyeoxhvwzzfcrpxcxb/sql/new')
  console.log('\n📋 Cole e execute o SQL abaixo:\n')

  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')

  console.log(schema)
  console.log('\n✅ Depois de executar, volte aqui e confirme!')
}

createTables()
