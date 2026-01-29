"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LocationSelects } from "@/components/LocationSelects"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  User,
  CheckCircle2,
  Upload,
  FileText,
  X,
  ExternalLink,
  Building2,
  GraduationCap,
  IdCard,
  Trash2,
  Loader2,
  Camera,
  Link as LinkIcon,
  Copy,
  Check,
  Star,
  MapPin,
  Mail,
  Phone,
  Save,
  Eye,
  Award,
  Shield,
  TrendingUp
} from "lucide-react"
import { LIMITS, ALLOWED_FILE_TYPES, isValidCep, cleanDigits } from "@/lib/validations"

interface Avaliacao {
  id: string
  nota: number
  comentario: string | null
  resposta_profissional: string | null
  created_at: string
  clientes: {
    nome: string
  } | null
}

interface Selo {
  id: string
  tipo: string
  data_inicio: string
  data_fim: string
  media_avaliacoes: number
  total_avaliacoes: number
  ativo: boolean
}

interface Elegibilidade {
  elegivel: boolean
  mediaAtual: number
  totalAvaliacoes: number
  minimoNecessario: number
  minimoAvaliacoes: number
  temSeloAtivo?: boolean
  proximaVerificacao?: string
  novoSeloConquistado?: boolean
}

interface Profissional {
  id: string
  tipo: string
  nome: string
  razao_social?: string
  email: string
  telefone: string
  cpf_cnpj: string
  cep?: string
  endereco?: string
  cidade: string
  estado: string
  saldo_moedas: number
  cliente_id?: string
  documento_url?: string | null
  documento_empresa_url?: string | null
  diplomas_urls?: string[] | null
  foto_url?: string | null
  sobre?: string | null
  slug?: string | null
  atende_online?: boolean
}

function StarDisplay({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  )
}

export default function PerfilProfissional() {
  const router = useRouter()
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [copiado, setCopiado] = useState(false)
  const [activeTab, setActiveTab] = useState("perfil")

  // Avaliações
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [mediaAvaliacoes, setMediaAvaliacoes] = useState(0)

  // Selos
  const [selos, setSelos] = useState<Selo[]>([])
  const [elegibilidade, setElegibilidade] = useState<Elegibilidade | null>(null)
  const [loadingSelos, setLoadingSelos] = useState(false)

  // Estados para modal de tornar cliente
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [clienteLoading, setClienteLoading] = useState(false)
  const [clienteSuccess, setClienteSuccess] = useState(false)
  const [clienteSenha, setClienteSenha] = useState("")
  const [clienteConfirmarSenha, setClienteConfirmarSenha] = useState("")

  // Estados para upload de documentos
  const [documentoIdentidade, setDocumentoIdentidade] = useState<File | null>(null)
  const [documentoEmpresa, setDocumentoEmpresa] = useState<File | null>(null)
  const [diploma, setDiploma] = useState<File | null>(null)
  const [uploadingIdentidade, setUploadingIdentidade] = useState(false)
  const [uploadingEmpresa, setUploadingEmpresa] = useState(false)
  const [uploadingDiploma, setUploadingDiploma] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [removingDiploma, setRemovingDiploma] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: "",
    razao_social: "",
    email: "",
    telefone: "",
    cep: "",
    endereco: "",
    cidade: "",
    estado: "",
    sobre: "",
    atende_online: false,
  })
  const [buscandoCep, setBuscandoCep] = useState(false)

  useEffect(() => {
    fetchProfissionalData()
  }, [])

  const fetchProfissionalData = async () => {
    const usuarioData = localStorage.getItem('usuario')
    if (!usuarioData) return

    const user = JSON.parse(usuarioData)

    try {
      const response = await fetch(`/api/profissional/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const prof = data.profissional
        setProfissional(prof)
        localStorage.setItem('usuario', JSON.stringify(prof))
        setFormData({
          nome: prof.nome,
          razao_social: prof.razao_social || "",
          email: prof.email,
          telefone: prof.telefone,
          cep: prof.cep || "",
          endereco: prof.endereco || "",
          cidade: prof.cidade || "",
          estado: prof.estado || "",
          sobre: prof.sobre || "",
          atende_online: prof.atende_online || false,
        })
        fetchAvaliacoes(prof.id)
        fetchSelos(prof.id)
      } else {
        setProfissional(user)
        setFormData({
          nome: user.nome,
          razao_social: user.razao_social || "",
          email: user.email,
          telefone: user.telefone,
          cep: user.cep || "",
          endereco: user.endereco || "",
          cidade: user.cidade || "",
          estado: user.estado || "",
          sobre: user.sobre || "",
          atende_online: user.atende_online || false,
        })
      }
    } catch {
      setProfissional(user)
      setFormData({
        nome: user.nome,
        razao_social: user.razao_social || "",
        email: user.email,
        telefone: user.telefone,
        cep: user.cep || "",
        endereco: user.endereco || "",
        cidade: user.cidade || "",
        estado: user.estado || "",
        sobre: user.sobre || "",
        atende_online: user.atende_online || false,
      })
    }
  }

  const fetchAvaliacoes = async (profissionalId: string) => {
    try {
      const response = await fetch(`/api/avaliacoes?profissional_id=${profissionalId}`)
      if (response.ok) {
        const data = await response.json()
        setAvaliacoes(data)
        if (data.length > 0) {
          const soma = data.reduce((acc: number, av: Avaliacao) => acc + av.nota, 0)
          setMediaAvaliacoes(Math.round((soma / data.length) * 10) / 10)
        }
      }
    } catch (err) {
      console.error('Erro ao buscar avaliações:', err)
    }
  }

  const fetchSelos = async (profissionalId: string) => {
    setLoadingSelos(true)
    try {
      const response = await fetch(`/api/profissional/selos?profissional_id=${profissionalId}`)
      if (response.ok) {
        const data = await response.json()
        setSelos(data.selos || [])
        setElegibilidade(data.elegibilidade)
      }
    } catch (err) {
      console.error('Erro ao buscar selos:', err)
    } finally {
      setLoadingSelos(false)
    }
  }

  const getPerfilUrl = () => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    const identifier = profissional?.slug || profissional?.id
    return `${baseUrl}/profissional/${identifier}`
  }

  const copiarLink = () => {
    navigator.clipboard.writeText(getPerfilUrl())
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // Formatar CEP: 00000-000
  const formatarCep = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 8)
    if (numeros.length <= 5) return numeros
    return `${numeros.slice(0, 5)}-${numeros.slice(5)}`
  }

  const buscarCep = async (cep: string) => {
    const cepLimpo = cleanDigits(cep)
    if (!isValidCep(cep)) return

    setBuscandoCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro ? `${data.logradouro}${data.bairro ? ', ' + data.bairro : ''}` : prev.endereco,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }))
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err)
    } finally {
      setBuscandoCep(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let valorFormatado = value

    if (name === 'cep') {
      valorFormatado = formatarCep(value)
      if (valorFormatado.replace(/\D/g, '').length === 8) {
        buscarCep(valorFormatado)
      }
    }

    setFormData({
      ...formData,
      [name]: valorFormatado,
    })
  }

  const handleSaveProfile = async () => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/profissional/atualizar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profissional?.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao atualizar perfil")
        setLoading(false)
        return
      }

      localStorage.setItem('usuario', JSON.stringify(data.profissional))
      setProfissional(data.profissional)
      setSuccess("Perfil atualizado com sucesso!")
      setLoading(false)
      setTimeout(() => setSuccess(""), 3000)

    } catch {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  const handleTornarCliente = async () => {
    setError("")
    setClienteLoading(true)

    if (clienteSenha !== clienteConfirmarSenha) {
      setError("As senhas não coincidem")
      setClienteLoading(false)
      return
    }

    if (clienteSenha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      setClienteLoading(false)
      return
    }

    try {
      const response = await fetch("/api/profissional/tornar-cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profissional_id: profissional?.id,
          senha: clienteSenha,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao criar conta de cliente")
        setClienteLoading(false)
        return
      }

      setClienteSuccess(true)
      setClienteLoading(false)

    } catch {
      setError("Erro ao conectar com o servidor")
      setClienteLoading(false)
    }
  }

  // Upload de foto direto ao selecionar
  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profissional) return

    if (file.size > LIMITS.FILE_SIZE_BYTES) {
      setError(`A foto deve ter no máximo ${LIMITS.FILE_SIZE_MB}MB`)
      return
    }
    if (!ALLOWED_FILE_TYPES.IMAGE.includes(file.type)) {
      setError("Foto deve ser JPG, PNG ou WebP")
      return
    }

    setUploadingFoto(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("profissional_id", profissional.id)
      formData.append("documento", file)
      formData.append("tipo_documento", "foto")

      const response = await fetch("/api/profissional/upload-documento", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao fazer upload")
        setUploadingFoto(false)
        return
      }

      await fetchProfissionalData()
      setSuccess("Foto atualizada!")
      setUploadingFoto(false)
      setTimeout(() => setSuccess(""), 3000)

    } catch {
      setError("Erro ao conectar com o servidor")
      setUploadingFoto(false)
    }
  }

  // Handler genérico para seleção de arquivo
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > LIMITS.FILE_SIZE_BYTES) {
        setError(`O arquivo deve ter no máximo ${LIMITS.FILE_SIZE_MB}MB`)
        return
      }
      if (!ALLOWED_FILE_TYPES.DOCUMENT.includes(file.type)) {
        setError("Apenas arquivos PDF, JPG ou PNG são permitidos")
        return
      }
      setFile(file)
      setError("")
    }
  }

  // Upload de documento
  const handleUploadDocumento = async (
    file: File,
    tipoDocumento: 'identidade' | 'empresa' | 'diploma',
    setUploading: (v: boolean) => void,
    setFile: (f: File | null) => void
  ) => {
    if (!file || !profissional) return

    setUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("profissional_id", profissional.id)
      formData.append("documento", file)
      formData.append("tipo_documento", tipoDocumento)

      const response = await fetch("/api/profissional/upload-documento", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao fazer upload")
        setUploading(false)
        return
      }

      await fetchProfissionalData()
      setFile(null)
      setSuccess("Documento enviado!")
      setUploading(false)
      setTimeout(() => setSuccess(""), 3000)

    } catch {
      setError("Erro ao conectar com o servidor")
      setUploading(false)
    }
  }

  // Remover diploma
  const handleRemoverDiploma = async (diplomaUrl: string) => {
    if (!profissional) return

    setRemovingDiploma(diplomaUrl)
    setError("")

    try {
      const response = await fetch("/api/profissional/upload-documento", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profissional_id: profissional.id,
          diploma_url: diplomaUrl
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao remover diploma")
        setRemovingDiploma(null)
        return
      }

      await fetchProfissionalData()
      setSuccess("Diploma removido!")
      setRemovingDiploma(null)
      setTimeout(() => setSuccess(""), 3000)

    } catch {
      setError("Erro ao conectar com o servidor")
      setRemovingDiploma(null)
    }
  }

  if (!profissional) {
    return (
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-12 w-full rounded-lg mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Alertas */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {success}</span>
          <button onClick={() => setSuccess("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Card do Perfil */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 h-24" />
            <CardContent className="pt-0 -mt-12">
              {/* Foto de Perfil */}
              <div className="relative inline-block">
                <div
                  className="relative w-24 h-24 rounded-full border-4 border-white bg-white cursor-pointer group"
                  onClick={() => fotoInputRef.current?.click()}
                >
                  {uploadingFoto ? (
                    <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    </div>
                  ) : profissional.foto_url ? (
                    <Image
                      src={profissional.foto_url}
                      alt={profissional.nome}
                      width={96}
                      height={96}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center">
                      {profissional.tipo === "empresa" ? (
                        <Building2 className="w-10 h-10 text-primary-600" />
                      ) : (
                        <User className="w-10 h-10 text-primary-600" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <input
                  ref={fotoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFotoChange}
                />
              </div>

              {/* Nome e Info */}
              <div className="mt-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {profissional.tipo === "empresa" ? profissional.razao_social : profissional.nome}
                </h2>
                {profissional.tipo === "empresa" && (
                  <p className="text-sm text-gray-500">{profissional.nome}</p>
                )}
                <Badge variant="secondary" className="mt-2">
                  {profissional.tipo === "empresa" ? "Empresa" : "Autônomo"}
                </Badge>
              </div>

              {/* Avaliação */}
              {avaliacoes.length > 0 && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-50 rounded-lg">
                  <StarDisplay rating={Math.round(mediaAvaliacoes)} size={18} />
                  <span className="font-semibold text-gray-900">{mediaAvaliacoes.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({avaliacoes.length})</span>
                </div>
              )}

              {/* Info de Contato */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{profissional.cidade && profissional.estado ? `${profissional.cidade}, ${profissional.estado}` : "Localização não informada"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{profissional.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{profissional.telefone}</span>
                </div>
              </div>

              {/* Link Público */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Seu link público</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(getPerfilUrl(), '_blank')}
                    className="h-8 px-2"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                {!profissional.slug && (
                  <p className="text-xs text-amber-600 mb-2">
                    Salve o perfil para gerar link com seu nome
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    value={getPerfilUrl()}
                    readOnly
                    className="text-xs h-9"
                  />
                  <Button onClick={copiarLink} variant="outline" size="sm" className="h-9 px-3">
                    {copiado ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Também sou cliente */}
              {!profissional.cliente_id ? (
                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => setShowClienteModal(true)}
                >
                  Também quero solicitar serviços
                </Button>
              ) : (
                <div className="mt-6 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Você também é cliente</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Tabs de Conteúdo */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 bg-white border mb-4 h-auto p-1">
              <TabsTrigger value="perfil" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                Perfil
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                Docs
              </TabsTrigger>
              <TabsTrigger value="selos" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                Selos {selos.length > 0 && <Award className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-amber-500" />}
              </TabsTrigger>
              <TabsTrigger value="avaliacoes" className="text-xs sm:text-sm py-2 px-1 sm:px-3">
                <span className="hidden sm:inline">Avaliações</span>
                <span className="sm:hidden">Aval.</span>
                {avaliacoes.length > 0 && <span className="ml-1">({avaliacoes.length})</span>}
              </TabsTrigger>
            </TabsList>

            {/* Tab Perfil */}
            <TabsContent value="perfil" className="mt-0">
              <Card>
                <CardContent className="pt-6 px-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">Informações do Perfil</h3>
                      <p className="text-sm text-gray-500">Atualize seus dados pessoais</p>
                    </div>
                    <Button onClick={handleSaveProfile} disabled={loading} className="w-full sm:w-auto">
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Salvar alterações
                    </Button>
                  </div>

                  <div className="space-y-5">
                    {/* Nome e Razão Social */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome" className="text-sm font-medium">
                          {profissional.tipo === 'autonomo' ? 'Nome Completo' : 'Nome do Responsável'}
                        </Label>
                        <Input
                          id="nome"
                          name="nome"
                          value={formData.nome}
                          onChange={handleChange}
                          className="h-11"
                        />
                      </div>

                      {profissional.tipo === 'empresa' && (
                        <div className="space-y-2">
                          <Label htmlFor="razao_social" className="text-sm font-medium">Razão Social</Label>
                          <Input
                            id="razao_social"
                            name="razao_social"
                            value={formData.razao_social}
                            onChange={handleChange}
                            className="h-11"
                          />
                        </div>
                      )}
                    </div>

                    {/* CPF/CNPJ e Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{profissional.tipo === 'autonomo' ? 'CPF' : 'CNPJ'}</Label>
                        <Input value={profissional.cpf_cnpj} disabled className="bg-gray-100 h-11 text-gray-500" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="h-11"
                        />
                      </div>
                    </div>

                    {/* Telefone e CEP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telefone" className="text-sm font-medium">Telefone/WhatsApp</Label>
                        <Input
                          id="telefone"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleChange}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cep" className="text-sm font-medium">CEP</Label>
                        <div className="relative">
                          <Input
                            id="cep"
                            name="cep"
                            placeholder="00000-000"
                            value={formData.cep}
                            onChange={handleChange}
                            className="h-11"
                          />
                          {buscandoCep && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="space-y-2">
                      <Label htmlFor="endereco" className="text-sm font-medium">Endereço</Label>
                      <Input
                        id="endereco"
                        name="endereco"
                        placeholder="Rua, número, bairro"
                        value={formData.endereco}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>

                    {/* Estado e Cidade */}
                    <div>
                      <LocationSelects
                        estado={formData.estado}
                        cidade={formData.cidade}
                        onEstadoChange={(sigla) => setFormData(prev => ({ ...prev, estado: sigla, cidade: "" }))}
                        onCidadeChange={(nome) => setFormData(prev => ({ ...prev, cidade: nome }))}
                      />
                    </div>

                    {/* Sobre */}
                    <div className="space-y-2">
                      <Label htmlFor="sobre" className="text-sm font-medium">Sobre você</Label>
                      <Textarea
                        id="sobre"
                        name="sobre"
                        placeholder="Conte um pouco sobre você, sua experiência e especialidades..."
                        value={formData.sobre}
                        onChange={handleChange}
                        rows={4}
                        maxLength={1000}
                        className="resize-none"
                      />
                      <p className="text-xs text-gray-500 text-right">{formData.sobre.length}/1000</p>
                    </div>
                  </div>

                  {/* Atende Online */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="atende_online"
                        checked={formData.atende_online || false}
                        onChange={(e) => setFormData({ ...formData, atende_online: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <Label htmlFor="atende_online" className="font-medium cursor-pointer">
                          Atendo clientes online (todo o Brasil)
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          Marque esta opção se você pode atender clientes remotamente, de qualquer lugar do Brasil.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Documentos */}
            <TabsContent value="documentos" className="mt-0">
              <Card>
                <CardContent className="pt-6 px-4 sm:px-6">
                  <h3 className="text-lg font-semibold mb-2">Documentos</h3>
                  <p className="text-sm text-gray-500 mb-6">Envie seus documentos para validação</p>

                  <div className="space-y-4">
                    {/* Documento de Identificação */}
                    <div className="border rounded-xl overflow-hidden">
                      <div className="p-4 bg-blue-50 border-b border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <IdCard className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-blue-900">RG ou CNH</h4>
                            <p className="text-xs text-blue-700">Documento de identificação</p>
                          </div>
                          {profissional.documento_url && (
                            <Badge className="bg-green-500 text-white flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {profissional.documento_url && (
                          <a
                            href={profissional.documento_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Ver documento atual
                          </a>
                        )}

                        {!documentoIdentidade ? (
                          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                              {profissional.documento_url ? 'Atualizar documento' : 'Enviar documento'}
                            </span>
                            <span className="text-xs text-gray-500">PDF, JPG ou PNG (máx. 5MB)</span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect(e, setDocumentoIdentidade)}
                            />
                          </label>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <span className="text-sm truncate flex-1">{documentoIdentidade.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDocumentoIdentidade(null)}
                                className="h-8 w-8 p-0 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => handleUploadDocumento(documentoIdentidade, 'identidade', setUploadingIdentidade, setDocumentoIdentidade)}
                              disabled={uploadingIdentidade}
                            >
                              {uploadingIdentidade ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                              Enviar documento
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documento da Empresa */}
                    {profissional.tipo === 'empresa' && (
                      <div className="border rounded-xl overflow-hidden">
                        <div className="p-4 bg-purple-50 border-b border-purple-100">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-purple-900">Documento da Empresa</h4>
                              <p className="text-xs text-purple-700">Contrato Social ou CNPJ</p>
                            </div>
                            {profissional.documento_empresa_url && (
                              <Badge className="bg-green-500 text-white flex-shrink-0">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {profissional.documento_empresa_url && (
                            <a
                              href={profissional.documento_empresa_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-lg font-medium text-sm hover:bg-purple-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver documento atual
                            </a>
                          )}

                          {!documentoEmpresa ? (
                            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-purple-400 transition-all">
                              <Upload className="w-8 h-8 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">
                                {profissional.documento_empresa_url ? 'Atualizar documento' : 'Enviar documento'}
                              </span>
                              <span className="text-xs text-gray-500">PDF, JPG ou PNG (máx. 5MB)</span>
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileSelect(e, setDocumentoEmpresa)}
                              />
                            </label>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <FileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                <span className="text-sm truncate flex-1">{documentoEmpresa.name}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDocumentoEmpresa(null)}
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => handleUploadDocumento(documentoEmpresa, 'empresa', setUploadingEmpresa, setDocumentoEmpresa)}
                                disabled={uploadingEmpresa}
                              >
                                {uploadingEmpresa ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                Enviar documento
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Diplomas */}
                    <div className="border rounded-xl overflow-hidden">
                      <div className="p-4 bg-amber-50 border-b border-amber-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-amber-900">Diplomas e Certificados</h4>
                            <p className="text-xs text-amber-700">Opcional - adicione quantos quiser</p>
                          </div>
                          {profissional.diplomas_urls && profissional.diplomas_urls.length > 0 && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 flex-shrink-0">
                              {profissional.diplomas_urls.length}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {/* Lista de diplomas */}
                        {profissional.diplomas_urls && profissional.diplomas_urls.length > 0 && (
                          <div className="space-y-2">
                            {profissional.diplomas_urls.map((url, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                                <GraduationCap className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <span className="text-sm font-medium flex-1">Diploma {idx + 1}</span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-amber-700 hover:text-amber-800 font-medium"
                                >
                                  Ver
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoverDiploma(url)}
                                  disabled={removingDiploma === url}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                >
                                  {removingDiploma === url ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload de diploma */}
                        {!diploma ? (
                          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-amber-400 transition-all">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Adicionar diploma</span>
                            <span className="text-xs text-gray-500">PDF, JPG ou PNG (máx. 5MB)</span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileSelect(e, setDiploma)}
                            />
                          </label>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <FileText className="w-5 h-5 text-amber-600 flex-shrink-0" />
                              <span className="text-sm truncate flex-1">{diploma.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDiploma(null)}
                                className="h-8 w-8 p-0 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              className="w-full bg-amber-500 hover:bg-amber-600"
                              onClick={() => handleUploadDocumento(diploma, 'diploma', setUploadingDiploma, setDiploma)}
                              disabled={uploadingDiploma}
                            >
                              {uploadingDiploma ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                              Enviar diploma
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Selos */}
            <TabsContent value="selos" className="mt-0">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-6">Selos de Qualidade</h3>

                  {loadingSelos ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Selo Ativo */}
                      {selos.length > 0 ? (
                        <div className="space-y-4">
                          {selos.map((selo) => (
                            <div key={selo.id} className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                                  <Award className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold text-amber-800">Selo de Qualidade</h4>
                                  <p className="text-sm text-amber-700">
                                    Média de {selo.media_avaliacoes.toFixed(1)} estrelas com {selo.total_avaliacoes} avaliações
                                  </p>
                                  <p className="text-xs text-amber-600 mt-1">
                                    Válido até {new Date(selo.data_fim).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <Badge className="bg-amber-500 text-white">Ativo</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Award className="w-10 h-10 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-700 mb-2">Nenhum selo ainda</h4>
                          <p className="text-sm text-gray-500 max-w-md mx-auto">
                            Conquiste o Selo de Qualidade mantendo uma média de avaliações acima de 4 estrelas por 6 meses.
                          </p>
                        </div>
                      )}

                      {/* Progresso / Elegibilidade */}
                      {elegibilidade && (
                        <div className="p-4 border rounded-lg bg-gray-50">
                          <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-600" />
                            Seu Progresso
                          </h4>

                          <div className="space-y-4">
                            {/* Média atual */}
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Média de avaliações (6 meses)</span>
                                <span className="font-medium">
                                  {elegibilidade.mediaAtual.toFixed(1)} / {elegibilidade.minimoNecessario.toFixed(1)}
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    elegibilidade.mediaAtual >= elegibilidade.minimoNecessario
                                      ? 'bg-green-500'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min((elegibilidade.mediaAtual / 5) * 100, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Total de avaliações */}
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Avaliações recebidas</span>
                                <span className="font-medium">
                                  {elegibilidade.totalAvaliacoes} / {elegibilidade.minimoAvaliacoes} mínimo
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    elegibilidade.totalAvaliacoes >= elegibilidade.minimoAvaliacoes
                                      ? 'bg-green-500'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min((elegibilidade.totalAvaliacoes / elegibilidade.minimoAvaliacoes) * 100, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Status */}
                            <div className="pt-2 border-t">
                              {elegibilidade.temSeloAtivo ? (
                                <div className="flex items-center gap-2 text-green-700">
                                  <CheckCircle2 className="w-5 h-5" />
                                  <span className="text-sm">
                                    Você possui o Selo de Qualidade! Próxima verificação em{' '}
                                    {elegibilidade.proximaVerificacao &&
                                      new Date(elegibilidade.proximaVerificacao).toLocaleDateString('pt-BR')
                                    }
                                  </span>
                                </div>
                              ) : elegibilidade.elegivel ? (
                                <div className="flex items-center gap-2 text-green-700">
                                  <CheckCircle2 className="w-5 h-5" />
                                  <span className="text-sm">Você está elegível para o Selo de Qualidade!</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Shield className="w-5 h-5" />
                                  <span className="text-sm">
                                    Continue prestando um bom serviço para conquistar o selo!
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Informações sobre o selo */}
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Como funciona o Selo de Qualidade?</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Mantenha média de avaliações ≥ 4 estrelas nos últimos 6 meses</li>
                          <li>• Tenha pelo menos 3 avaliações no período</li>
                          <li>• O selo é renovado automaticamente a cada 6 meses</li>
                          <li>• Quem te contrata verá o selo no seu perfil, transmitindo mais confiança</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Avaliações */}
            <TabsContent value="avaliacoes" className="mt-0">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-6">Avaliações Recebidas</h3>

                  {avaliacoes.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Você ainda não recebeu avaliações</p>
                      <p className="text-sm text-gray-400 mt-1">Complete serviços para receber avaliações dos clientes</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {avaliacoes.map((avaliacao) => (
                        <div key={avaliacao.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{avaliacao.clientes?.nome || "Cliente"}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(avaliacao.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <StarDisplay rating={avaliacao.nota} size={16} />
                          </div>
                          {avaliacao.comentario && (
                            <p className="text-gray-700 text-sm">{avaliacao.comentario}</p>
                          )}
                          {avaliacao.resposta_profissional && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                              <p className="text-xs font-medium text-gray-500 mb-1">Sua resposta:</p>
                              <p className="text-sm text-gray-700">{avaliacao.resposta_profissional}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal para Tornar-se Cliente */}
      <Dialog open={showClienteModal} onOpenChange={setShowClienteModal}>
        <DialogContent className="sm:max-w-[400px]">
          {!clienteSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Criar conta de Cliente</DialogTitle>
                <DialogDescription>
                  Defina uma senha para acessar como cliente
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Senha <span className="text-red-500">*</span></Label>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={clienteSenha}
                    onChange={(e) => setClienteSenha(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Confirmar senha <span className="text-red-500">*</span></Label>
                  <Input
                    type="password"
                    placeholder="Confirme sua senha"
                    value={clienteConfirmarSenha}
                    onChange={(e) => setClienteConfirmarSenha(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClienteModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleTornarCliente} disabled={clienteLoading}>
                  {clienteLoading ? "Criando..." : "Criar conta"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <DialogTitle className="text-center">Conta criada!</DialogTitle>
                <DialogDescription className="text-center">
                  Sua conta de cliente foi criada com sucesso.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => {
                  setShowClienteModal(false)
                  window.location.reload()
                }} className="w-full">
                  Entendi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
