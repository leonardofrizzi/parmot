"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LocationSelects } from "@/components/LocationSelects"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, CheckCircle2, Upload, FileText, X, ExternalLink, Building2, GraduationCap, IdCard, Trash2, Loader2 } from "lucide-react"

interface Profissional {
  id: string
  tipo: string
  nome: string
  razao_social?: string
  email: string
  telefone: string
  cpf_cnpj: string
  cidade: string
  estado: string
  saldo_moedas: number
  cliente_id?: string
  documento_url?: string | null
  documento_empresa_url?: string | null
  diplomas_urls?: string[] | null
}

export default function PerfilProfissional() {
  const router = useRouter()
  const [profissional, setProfissional] = useState<Profissional | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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
  const [removingDiploma, setRemovingDiploma] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: "",
    razao_social: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
  })

  useEffect(() => {
    fetchProfissionalData()
  }, [])

  const fetchProfissionalData = async () => {
    const usuarioData = localStorage.getItem('usuario')
    if (!usuarioData) return

    const user = JSON.parse(usuarioData)

    // Buscar dados atualizados do banco
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
          cidade: prof.cidade || "",
          estado: prof.estado || "",
        })
      } else {
        // Fallback para dados do localStorage
        setProfissional(user)
        setFormData({
          nome: user.nome,
          razao_social: user.razao_social || "",
          email: user.email,
          telefone: user.telefone,
          cidade: user.cidade || "",
          estado: user.estado || "",
        })
      }
    } catch {
      setProfissional(user)
      setFormData({
        nome: user.nome,
        razao_social: user.razao_social || "",
        email: user.email,
        telefone: user.telefone,
        cidade: user.cidade || "",
        estado: user.estado || "",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSaveProfile = async () => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/profissional/atualizar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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
      setEditMode(false)
      setLoading(false)

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

  // Handler genérico para seleção de arquivo
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("O arquivo deve ter no máximo 5MB")
        return
      }
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
      if (!allowedTypes.includes(file.type)) {
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
        setError(data.error || "Erro ao fazer upload do documento")
        setUploading(false)
        return
      }

      // Atualizar profissional
      await fetchProfissionalData()
      setFile(null)
      setSuccess("Documento enviado com sucesso!")
      setUploading(false)

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
      setSuccess("Diploma removido com sucesso!")
      setRemovingDiploma(null)

    } catch {
      setError("Erro ao conectar com o servidor")
      setRemovingDiploma(null)
    }
  }

  if (!profissional) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="max-w-2xl space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações e documentos</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          {success}
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Categorias de Atuação */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias de Atuação</CardTitle>
            <CardDescription>Defina quais tipos de serviço você atende</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Você só receberá solicitações das categorias que selecionar
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/dashboard/profissional/perfil/categorias'}
            >
              Gerenciar Categorias
            </Button>
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Meus Documentos
            </CardTitle>
            <CardDescription>
              Gerencie seus documentos de identificação e certificados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Documento de Identificação Pessoal */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4 text-gray-500" />
                <Label className="font-medium">Documento de Identificação Pessoal</Label>
              </div>
              <p className="text-xs text-gray-500">
                RG ou CNH {profissional.tipo === 'empresa' ? 'do responsável' : ''}
              </p>

              {profissional.documento_url && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Documento enviado</span>
                    </div>
                    <a
                      href={profissional.documento_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      <span>Ver</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}

              {!documentoIdentidade ? (
                <label
                  htmlFor="doc-identidade"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <Upload className="w-6 h-6 mb-1 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    {profissional.documento_url ? 'Atualizar documento' : 'Enviar documento'}
                  </p>
                  <p className="text-xs text-gray-400">PDF, JPG ou PNG (máx. 5MB)</p>
                  <input
                    id="doc-identidade"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(e, setDocumentoIdentidade)}
                  />
                </label>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">{documentoIdentidade.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDocumentoIdentidade(null)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleUploadDocumento(documentoIdentidade, 'identidade', setUploadingIdentidade, setDocumentoIdentidade)}
                    disabled={uploadingIdentidade}
                    size="sm"
                    className="w-full"
                  >
                    {uploadingIdentidade ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : "Enviar Documento"}
                  </Button>
                </div>
              )}
            </div>

            {/* Documento da Empresa (apenas para empresas) */}
            {profissional.tipo === 'empresa' && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <Label className="font-medium">Documento da Empresa</Label>
                </div>
                <p className="text-xs text-gray-500">Contrato Social ou Cartão CNPJ</p>

                {profissional.documento_empresa_url && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Documento enviado</span>
                      </div>
                      <a
                        href={profissional.documento_empresa_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        <span>Ver</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )}

                {!documentoEmpresa ? (
                  <label
                    htmlFor="doc-empresa"
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Upload className="w-6 h-6 mb-1 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      {profissional.documento_empresa_url ? 'Atualizar documento' : 'Enviar documento'}
                    </p>
                    <p className="text-xs text-gray-400">PDF, JPG ou PNG (máx. 5MB)</p>
                    <input
                      id="doc-empresa"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileSelect(e, setDocumentoEmpresa)}
                    />
                  </label>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900 truncate">{documentoEmpresa.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDocumentoEmpresa(null)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={() => handleUploadDocumento(documentoEmpresa, 'empresa', setUploadingEmpresa, setDocumentoEmpresa)}
                      disabled={uploadingEmpresa}
                      size="sm"
                      className="w-full"
                    >
                      {uploadingEmpresa ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : "Enviar Documento"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Diplomas e Certificados */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <Label className="font-medium">Diplomas e Certificados</Label>
                <span className="text-xs text-gray-400">(opcional)</span>
              </div>

              {/* Lista de diplomas existentes */}
              {profissional.diplomas_urls && profissional.diplomas_urls.length > 0 && (
                <div className="space-y-2">
                  {profissional.diplomas_urls.map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Diploma {idx + 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          <span>Ver</span>
                          <ExternalLink size={12} />
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverDiploma(url)}
                          disabled={removingDiploma === url}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {removingDiploma === url ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 text-right">
                    {profissional.diplomas_urls.length} arquivo(s)
                  </p>
                </div>
              )}

              {/* Upload de novo diploma */}
              {(
                <>
                  {!diploma ? (
                    <label
                      htmlFor="doc-diploma"
                      className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Upload className="w-5 h-5 mb-1 text-gray-400" />
                      <p className="text-sm text-gray-500">Adicionar diploma/certificado</p>
                      <input
                        id="doc-diploma"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileSelect(e, setDiploma)}
                      />
                    </label>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <p className="text-sm font-medium text-gray-900 truncate">{diploma.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDiploma(null)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleUploadDocumento(diploma, 'diploma', setUploadingDiploma, setDiploma)}
                        disabled={uploadingDiploma}
                        size="sm"
                        className="w-full"
                      >
                        {uploadingDiploma ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : "Adicionar Diploma"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize seus dados cadastrais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Cadastro</Label>
                <Input
                  value={profissional.tipo === 'autonomo' ? 'Autônomo' : 'Empresa'}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">
                  {profissional.tipo === 'autonomo' ? 'Nome Completo' : 'Nome do Responsável'}
                </Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={handleChange}
                  disabled={!editMode}
                />
              </div>

              {profissional.tipo === 'empresa' && (
                <div className="space-y-2">
                  <Label htmlFor="razao_social">Razão Social</Label>
                  <Input
                    id="razao_social"
                    name="razao_social"
                    type="text"
                    value={formData.razao_social}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{profissional.tipo === 'autonomo' ? 'CPF' : 'CNPJ'}</Label>
                <Input
                  value={profissional.cpf_cnpj}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editMode}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={handleChange}
                  disabled={!editMode}
                />
              </div>

              {editMode ? (
                <LocationSelects
                  estado={formData.estado}
                  cidade={formData.cidade}
                  onEstadoChange={(sigla) => setFormData(prev => ({ ...prev, estado: sigla }))}
                  onCidadeChange={(nome) => setFormData(prev => ({ ...prev, cidade: nome }))}
                />
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={formData.estado || "Não informado"}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.cidade || "Não informado"}
                      disabled
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                {!editMode ? (
                  <Button
                    onClick={() => {
                      setEditMode(true)
                      setError("")
                      setSuccess("")
                    }}
                    className="w-full"
                  >
                    Editar Perfil
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1"
                      disabled={loading}
                    >
                      {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditMode(false)
                        setError("")
                        setSuccess("")
                        setFormData({
                          nome: profissional.nome,
                          razao_social: profissional.razao_social || "",
                          email: profissional.email,
                          telefone: profissional.telefone,
                          cidade: profissional.cidade || "",
                          estado: profissional.estado || "",
                        })
                      }}
                      className="flex-1"
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Também sou Cliente */}
        {!profissional.cliente_id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Também preciso de serviços
              </CardTitle>
              <CardDescription>
                Solicite serviços de outros profissionais na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Ao ativar o modo cliente, você poderá solicitar serviços de outros profissionais
                da plataforma, como aulas de música, reforço escolar ou idiomas.
              </p>
              <Button onClick={() => setShowClienteModal(true)}>
                Quero solicitar serviços
              </Button>
            </CardContent>
          </Card>
        )}

        {profissional.cliente_id && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                Você também é cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 mb-4">
                Você possui uma conta de cliente vinculada. Faça login como cliente para solicitar serviços.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('usuario')
                  localStorage.removeItem('tipoUsuario')
                  router.push('/login')
                }}
              >
                Acessar como Cliente
              </Button>
            </CardContent>
          </Card>
        )}
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
                  <Label>Senha para acesso como cliente <span className="text-red-500">*</span></Label>
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

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error}
                  </div>
                )}
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
                <DialogTitle className="text-center">Conta criada com sucesso!</DialogTitle>
                <DialogDescription className="text-center">
                  Sua conta de cliente foi criada. Agora você pode solicitar serviços na plataforma.
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
