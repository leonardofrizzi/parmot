import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log('🚀 Configurando banco de dados...')

  const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf-8')

  // Nota: O SQL será executado manualmente no Supabase SQL Editor
  console.log('\n📋 Execute o seguinte SQL no Supabase SQL Editor:')
  console.log('   https://supabase.com/dashboard/project/vnnyeoxhvwzzfcrpxcxb/sql/new')
  console.log('\n' + schema)
  console.log('\n✅ Depois de executar o SQL, as tabelas estarão prontas!')
}

setupDatabase()
