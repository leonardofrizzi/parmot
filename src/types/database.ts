export type TipoProfissional = 'autonomo' | 'empresa'
export type StatusSolicitacao = 'aberta' | 'em_andamento' | 'finalizada' | 'cancelada'
export type TipoTransacao = 'compra' | 'uso' | 'estorno'

export interface Categoria {
  id: string
  nome: string
  slug: string
  icone?: string
  ordem: number
  created_at: string
}

export interface Subcategoria {
  id: string
  categoria_id: string
  nome: string
  slug: string
  descricao?: string
  ordem: number
  created_at: string
}

export interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  cidade: string
  estado: string
  senha_hash: string
  created_at: string
  updated_at: string
}

export interface Profissional {
  id: string
  tipo: TipoProfissional
  nome: string
  razao_social?: string
  email: string
  telefone: string
  cpf_cnpj: string
  cidade: string
  estado: string
  atende_online: boolean
  senha_hash: string
  saldo_moedas: number
  created_at: string
  updated_at: string
}

export interface ProfissionalCategoria {
  id: string
  profissional_id: string
  categoria_id: string
  created_at: string
}

export interface Solicitacao {
  id: string
  cliente_id: string
  titulo: string
  descricao: string
  categoria_id: string
  subcategoria_id: string
  status: StatusSolicitacao
  created_at: string
  updated_at: string
  // Campos extras da API
  categoria_nome?: string
  categoria_icone?: string
  subcategoria_nome?: string
  respostas_count?: number
  cliente_cidade?: string
  cliente_estado?: string
}

export interface SolicitacaoDTO {
  titulo: string
  descricao: string
  categoria_id: string
  subcategoria_id: string
}

export interface Resposta {
  id: string
  solicitacao_id: string
  profissional_id: string
  mensagem: string
  contato_liberado: boolean
  created_at: string
}

export interface TransacaoMoeda {
  id: string
  profissional_id: string
  tipo: TipoTransacao
  quantidade: number
  descricao?: string
  created_at: string
}

// DTOs para cadastro
export interface CadastroClienteDTO {
  nome: string
  email: string
  telefone?: string
  cep: string
  endereco?: string
  cidade: string
  estado: string
  senha: string
  email_verificado?: boolean
}

export interface CadastroProfissionalDTO {
  tipo: TipoProfissional
  nome: string
  razaoSocial?: string
  email: string
  telefone: string
  cpfCnpj: string
  cep: string
  endereco?: string
  cidade: string
  estado: string
  senha: string
}
