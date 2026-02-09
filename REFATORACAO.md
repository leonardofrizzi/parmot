# Plano de Refatoração - Parmot

Este documento lista as oportunidades de refatoração identificadas no projeto, organizadas por prioridade.

---

## Status Geral

| Prioridade | Total | Concluído | Pendente |
|------------|-------|-----------|----------|
| Alta       | 3     | 0         | 3        |
| Média      | 5     | 3         | 2        |
| Baixa      | 7     | 2         | 5        |

---

## PRIORIDADE ALTA

### 1. [ ] Hook useAuth - Padrão localStorage do usuário

**Impacto:** 34 ocorrências em 19 arquivos

**Problema:**
```typescript
const usuarioData = localStorage.getItem('usuario')
if (!usuarioData) { router.push('/login'); return }
const usuario = JSON.parse(usuarioData)
```

**Solução:** Criar `src/hooks/useAuth.ts`
```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('usuario')
    if (!userData) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userData))
    setIsLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem('usuario')
    localStorage.removeItem('tipoUsuario')
    router.push('/login')
  }

  const updateUser = (data: Partial<User>) => {
    const updated = { ...user, ...data }
    localStorage.setItem('usuario', JSON.stringify(updated))
    setUser(updated)
  }

  return { user, isLoading, logout, updateUser }
}
```

**Arquivos a modificar:**
- Todas as páginas em `src/app/dashboard/`
- `src/components/Sidebar.tsx`

---

### 2. [ ] Tradução de erros do banco de dados

**Impacto:** 50+ linhas duplicadas em 2 arquivos

**Arquivos:**
- `src/app/api/cadastro/cliente/route.ts` (linhas 62-87)
- `src/app/api/cadastro/profissional/route.ts` (linhas 291-320)

**Problema:**
```typescript
if (error.message.includes('value too long')) {
  // parse field name...
}
if (error.message.includes('duplicate key')) {
  // email/cpf já existe...
}
// ... mais 20 linhas similares
```

**Solução:** Criar `src/lib/errorMessages.ts`
```typescript
interface PostgrestError {
  message: string
  code?: string
  details?: string
}

export function translateDatabaseError(
  error: PostgrestError,
  context?: 'cliente' | 'profissional'
): string {
  if (error.message.includes('value too long')) {
    const fieldMatch = error.message.match(/value too long for type .+ \((.+)\)/)
    if (fieldMatch) {
      const fieldName = fieldMatch[1]
      const fieldLabels: Record<string, string> = {
        nome: 'Nome',
        email: 'E-mail',
        telefone: 'Telefone',
        // ...
      }
      return `${fieldLabels[fieldName] || fieldName} excede o limite de caracteres`
    }
  }

  if (error.message.includes('duplicate key')) {
    if (error.message.includes('email')) return 'E-mail já cadastrado'
    if (error.message.includes('cpf_cnpj')) return 'CPF/CNPJ já cadastrado'
  }

  // ... outros casos

  return 'Erro ao processar solicitação'
}
```

---

### 3. [ ] Utilitários de senha (hash/verificação)

**Impacto:** 6+ locais com mesmo padrão

**Arquivos:**
- `src/app/api/cadastro/cliente/route.ts`
- `src/app/api/cadastro/profissional/route.ts`
- `src/app/api/auth/trocar-senha/route.ts`
- `src/app/api/admin/criar/route.ts`
- `src/app/api/login/route.ts`
- `src/app/api/client/redefinir-senha/route.ts`

**Solução:** Criar `src/lib/password.ts`
```typescript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'A senha deve ter no mínimo 6 caracteres' }
  }

  const hasUppercase = /[A-Z]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/.test(password)

  if (!hasUppercase || !hasSpecial) {
    return {
      valid: false,
      error: 'A senha deve conter pelo menos uma letra maiúscula e um caractere especial'
    }
  }

  return { valid: true }
}
```

---

## PRIORIDADE MÉDIA

### 4. [ ] Formatação de data

**Impacto:** 3 locais com função idêntica

**Arquivos:**
- `src/app/dashboard/cliente/solicitacoes/page.tsx`
- `src/app/dashboard/cliente/page.tsx`
- `src/app/dashboard/profissional/atendimentos/page.tsx`

**Solução:** Adicionar a `src/lib/utils.ts`
```typescript
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'short') {
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

---

### 5. [ ] Configuração de status (badges e cores)

**Impacto:** 3 locais com mapeamentos duplicados

**Arquivos:**
- `src/app/dashboard/cliente/solicitacoes/page.tsx`
- `src/app/dashboard/profissional/atendimentos/page.tsx`
- `src/app/dashboard/cliente/page.tsx`

**Solução:** Criar `src/lib/statusConfig.ts`
```typescript
export const STATUS_CONFIG = {
  aberta: {
    label: 'Aguardando propostas',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: 'Clock'
  },
  em_andamento: {
    label: 'Em andamento',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: 'Loader2'
  },
  finalizada: {
    label: 'Concluído',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: 'CheckCircle2'
  },
  cancelada: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: 'XCircle'
  }
} as const

export type StatusType = keyof typeof STATUS_CONFIG

export function getStatusLabel(status: string): string {
  return STATUS_CONFIG[status as StatusType]?.label || status
}

export function getStatusColor(status: string): string {
  return STATUS_CONFIG[status as StatusType]?.color || 'bg-gray-100 text-gray-800'
}
```

---

### 6. [x] Componente IconRenderer

**Impacto:** 4 locais com função idêntica

**Arquivos:**
- `src/app/dashboard/cliente/solicitacoes/page.tsx`
- `src/app/dashboard/cliente/page.tsx`
- `src/app/dashboard/profissional/atendimentos/page.tsx`
- `src/app/dashboard/cliente/solicitar/page.tsx`

**Solução:** Criar `src/components/IconRenderer.tsx`
```typescript
import * as Icons from 'lucide-react'

interface IconRendererProps {
  name?: string
  size?: number
  className?: string
}

export function IconRenderer({ name, size = 20, className }: IconRendererProps) {
  if (!name) return null

  const IconComponent = Icons[name as keyof typeof Icons] as React.ComponentType<{
    size?: number
    className?: string
  }>

  if (!IconComponent) return null

  return <IconComponent size={size} className={className} />
}
```

---

### 7. [x] Componente EmptyState

**Impacto:** 3 locais com estrutura idêntica

**Arquivos:**
- `src/app/dashboard/cliente/solicitacoes/page.tsx`
- `src/app/dashboard/profissional/atendimentos/page.tsx`
- `src/app/dashboard/cliente/page.tsx`

**Solução:** Criar `src/components/EmptyState.tsx`
```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="mb-4 text-gray-400 flex justify-center">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

---

### 8. [x] Componentes de Skeleton reutilizáveis

**Impacto:** 50+ linhas em 3 páginas

**Arquivos:**
- `src/app/dashboard/cliente/solicitacoes/page.tsx`
- `src/app/dashboard/profissional/atendimentos/page.tsx`
- `src/app/dashboard/cliente/page.tsx`

**Solução:** Criar componentes em `src/components/`:
- `SkeletonList.tsx` - Para listas de cards
- `SkeletonStats.tsx` - Para cards de estatísticas
- `SkeletonCard.tsx` - Card genérico

---

## PRIORIDADE BAIXA

### 9. [x] Hook useModalForm

**Impacto:** 2 componentes com padrão idêntico

**Arquivos:**
- `src/components/AvaliacaoModal.tsx`
- `src/components/ReembolsoModal.tsx`

**Solução:** Criar `src/hooks/useModalForm.ts`
```typescript
export function useModalForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submitForm = async <T>(handler: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError('')

    try {
      const result = await handler()
      setLoading(false)
      return result
    } catch (err) {
      setError('Erro ao conectar com o servidor')
      setLoading(false)
      return null
    }
  }

  const reset = () => {
    setLoading(false)
    setError('')
  }

  return { loading, error, setError, submitForm, reset }
}
```

---

### 10. [ ] Helpers do Supabase

**Impacto:** 4+ locais com queries similares

**Solução:** Criar `src/lib/supabaseHelpers.ts`
```typescript
export async function checkEmailExists(
  email: string,
  table: 'clientes' | 'profissionais'
): Promise<boolean> {
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq('email', email)
    .single()

  return !!data
}

export async function checkFieldExists(
  table: string,
  field: string,
  value: any,
  excludeId?: string
): Promise<boolean> {
  let query = supabase.from(table).select('id').eq(field, value)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.single()
  return !!data
}
```

---

### 11. [ ] Lógica de banimento unificada

**Impacto:** 2 arquivos quase idênticos

**Arquivos:**
- `src/app/api/admin/profissionais/banir/route.ts`
- `src/app/api/admin/usuarios/banir/route.ts`

**Solução:** Criar `src/lib/banishment.ts`

---

### 12. [ ] Hook useDashboardList

**Impacto:** 3+ páginas com mesmo padrão de estado

**Solução:** Criar `src/hooks/useDashboardList.ts`
```typescript
export function useDashboardList<T>(apiEndpoint: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(apiEndpoint)
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Erro ao carregar dados')
        return
      }
      setData(result.data || result)
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }, [apiEndpoint])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filtroStatus,
    setFiltroStatus,
    refetch: fetchData
  }
}
```

---

### 13. [ ] Hook useFilteredData

**Impacto:** 2 locais com lógica similar

**Solução:** Criar `src/hooks/useFilteredData.ts`
```typescript
export function useFilteredData<T extends Record<string, any>>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] {
  return useMemo(() => {
    if (!searchTerm.trim()) return data

    const termo = searchTerm.toLowerCase()
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field]
        return typeof value === 'string' && value.toLowerCase().includes(termo)
      })
    )
  }, [data, searchTerm, searchFields])
}
```

---

### 14. [x] Constantes de validação

**Solução:** Criar `src/lib/validations.ts`
```typescript
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d{10,11}$/,
  CEP: /^\d{5}-?\d{3}$/,
  CPF: /^\d{11}$/,
  CNPJ: /^\d{14}$/,
}

export const LIMITS = {
  FILE_SIZE_MB: 5,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
}

export const ALLOWED_FILE_TYPES = {
  DOCUMENT: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}
```

---

### 15. [ ] Wrapper de API

**Solução:** Criar `src/lib/apiResponse.ts`
```typescript
import { NextResponse } from 'next/server'

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export function apiHandler(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)
      return apiError('Erro interno do servidor')
    }
  }
}
```

---

## Ordem de Implementação Sugerida

1. **Fase 1 - Fundação** (Prioridade Alta)
   - [ ] `src/lib/password.ts`
   - [ ] `src/lib/errorMessages.ts`
   - [ ] `src/hooks/useAuth.ts`

2. **Fase 2 - Utilidades** (Prioridade Média)
   - [ ] Adicionar formatadores a `src/lib/utils.ts`
   - [ ] `src/lib/statusConfig.ts`
   - [ ] `src/lib/validations.ts`

3. **Fase 3 - Componentes** (Prioridade Média)
   - [ ] `src/components/IconRenderer.tsx`
   - [ ] `src/components/EmptyState.tsx`
   - [ ] `src/components/Skeleton*.tsx`

4. **Fase 4 - Hooks Avançados** (Prioridade Baixa)
   - [ ] `src/hooks/useModalForm.ts`
   - [ ] `src/hooks/useDashboardList.ts`
   - [ ] `src/hooks/useFilteredData.ts`

5. **Fase 5 - Backend** (Prioridade Baixa)
   - [ ] `src/lib/supabaseHelpers.ts`
   - [ ] `src/lib/apiResponse.ts`
   - [ ] Unificar rotas de banimento

---

## Estimativa de Redução

| Item | Linhas Removidas | Linhas Adicionadas | Ganho Líquido |
|------|------------------|-------------------|---------------|
| useAuth | ~100 | ~40 | ~60 |
| errorMessages | ~50 | ~30 | ~20 |
| password.ts | ~30 | ~25 | ~5 |
| formatDate | ~20 | ~15 | ~5 |
| statusConfig | ~40 | ~25 | ~15 |
| IconRenderer | ~20 | ~15 | ~5 |
| EmptyState | ~40 | ~25 | ~15 |
| Skeletons | ~50 | ~40 | ~10 |
| **Total** | **~350** | **~215** | **~135** |

---

*Última atualização: Janeiro 2026*
