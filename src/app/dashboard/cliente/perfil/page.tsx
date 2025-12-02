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
import { Briefcase, CheckCircle2, Clock, Upload, FileText, X, GraduationCap, Loader2, Eye, EyeOff } from "lucide-react"
import { compressImage } from "@/lib/compressImage"

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  cidade: string
  estado: string
  profissional_id?: string
}

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB (compressão vai reduzir)

export default function PerfilCliente() {
  const router = useRouter()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Estados para modal de tornar profissional
  const [showProfModal, setShowProfModal] = useState(false)
  const [profLoading, setProfLoading] = useState(false)
  const [profSuccess, setProfSuccess] = useState(false)
  const [profForm, setProfForm] = useState({
    tipo: "autonomo" as "autonomo" | "empresa",
    cpf_cnpj: "",
    razao_social: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  })

  // Estados para documentos
  const [identidadeFrente, setIdentidadeFrente] = useState<File | null>(null)
  const [identidadeVerso, setIdentidadeVerso] = useState<File | null>(null)
  const [documentoEmpresa, setDocumentoEmpresa] = useState<File | null>(null)
  const [diplomas, setDiplomas] = useState<{ frente: File; verso: File | null }[]>([])
  const [diplomaEmAndamento, setDiplomaEmAndamento] = useState<{ frente: File | null; verso: File | null }>({ frente: null, verso: null })

  // Estados de loading para compressão
  const [comprimindoIdentFrente, setComprimindoIdentFrente] = useState(false)
  const [comprimindoIdentVerso, setComprimindoIdentVerso] = useState(false)
  const [comprimindoEmpresa, setComprimindoEmpresa] = useState(false)
  const [comprimindoDiplomaFrente, setComprimindoDiplomaFrente] = useState(false)
  const [comprimindoDiplomaVerso, setComprimindoDiplomaVerso] = useState(false)

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
  })

  useEffect(() => {
    const usuarioData = localStorage.getItem('usuario')
    if (usuarioData) {
      const user = JSON.parse(usuarioData)
      setCliente(user)
      setFormData({
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        cidade: user.cidade || "",
        estado: user.estado || "",
      })
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Formatar CPF: 000.000.000-00
  const formatarCPF = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 11)
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  // Formatar CNPJ: 00.000.000/0000-00
  const formatarCNPJ = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 14)
    return numeros
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  // Formatar telefone: (00) 00000-0000
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 11)
    if (numeros.length <= 2) return numeros
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
  }

  const handleProfFormChange = (field: string, value: string) => {
    let valorFormatado = value

    if (field === 'cpf_cnpj') {
      valorFormatado = profForm.tipo === 'autonomo' ? formatarCPF(value) : formatarCNPJ(value)
    } else if (field === 'telefone') {
      valorFormatado = formatarTelefone(value)
    }

    setProfForm({ ...profForm, [field]: valorFormatado })
  }

  const handleSaveProfile = async () => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/cliente/atualizar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: cliente?.id,
          ...formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao atualizar perfil")
        setLoading(false)
        return
      }

      localStorage.setItem('usuario', JSON.stringify(data.cliente))
      setCliente(data.cliente)
      setSuccess("Perfil atualizado com sucesso!")
      setEditMode(false)
      setLoading(false)

    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  // Validar arquivo
  const validarArquivo = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`Arquivo muito grande! Máximo: 15MB`)
      return false
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      setError("Formato inválido! Use JPG, PNG ou PDF.")
      return false
    }
    return true
  }

  // Handlers de upload com compressão
  const handleIdentidadeFrenteChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validarArquivo(file)) {
      setComprimindoIdentFrente(true)
      setError("")
      try {
        const compressed = await compressImage(file)
        setIdentidadeFrente(compressed)
      } catch {
        setIdentidadeFrente(file)
      }
      setComprimindoIdentFrente(false)
    }
  }

  const handleIdentidadeVersoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validarArquivo(file)) {
      setComprimindoIdentVerso(true)
      setError("")
      try {
        const compressed = await compressImage(file)
        setIdentidadeVerso(compressed)
      } catch {
        setIdentidadeVerso(file)
      }
      setComprimindoIdentVerso(false)
    }
  }

  const handleEmpresaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validarArquivo(file)) {
      setComprimindoEmpresa(true)
      setError("")
      try {
        const compressed = await compressImage(file)
        setDocumentoEmpresa(compressed)
      } catch {
        setDocumentoEmpresa(file)
      }
      setComprimindoEmpresa(false)
    }
  }

  const handleDiplomaFrenteChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validarArquivo(file)) {
      setComprimindoDiplomaFrente(true)
      setError("")
      try {
        const compressed = await compressImage(file)
        setDiplomaEmAndamento({ ...diplomaEmAndamento, frente: compressed })
      } catch {
        setDiplomaEmAndamento({ ...diplomaEmAndamento, frente: file })
      }
      setComprimindoDiplomaFrente(false)
    }
  }

  const handleDiplomaVersoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validarArquivo(file)) {
      setComprimindoDiplomaVerso(true)
      setError("")
      try {
        const compressed = await compressImage(file)
        setDiplomaEmAndamento({ ...diplomaEmAndamento, verso: compressed })
      } catch {
        setDiplomaEmAndamento({ ...diplomaEmAndamento, verso: file })
      }
      setComprimindoDiplomaVerso(false)
    }
  }

  const adicionarDiploma = () => {
    if (diplomaEmAndamento.frente) {
      setDiplomas([...diplomas, { frente: diplomaEmAndamento.frente, verso: diplomaEmAndamento.verso }])
      setDiplomaEmAndamento({ frente: null, verso: null })
    }
  }

  const removerDiploma = (index: number) => {
    setDiplomas(diplomas.filter((_, i) => i !== index))
  }

  const handleTornarProfissional = async () => {
    setError("")
    setProfLoading(true)

    if (profForm.senha !== profForm.confirmarSenha) {
      setError("As senhas não coincidem")
      setProfLoading(false)
      return
    }

    if (profForm.senha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      setProfLoading(false)
      return
    }

    // Validar senha forte
    const temMaiuscula = /[A-Z]/.test(profForm.senha)
    const temEspecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/.test(profForm.senha)
    if (!temMaiuscula || !temEspecial) {
      setError("A senha deve conter pelo menos uma letra maiúscula e um caractere especial (!@#$%...)")
      setProfLoading(false)
      return
    }

    if (!profForm.cpf_cnpj) {
      setError(profForm.tipo === "autonomo" ? "CPF é obrigatório" : "CNPJ é obrigatório")
      setProfLoading(false)
      return
    }

    if (!profForm.telefone) {
      setError("Telefone é obrigatório para profissionais")
      setProfLoading(false)
      return
    }

    if (!identidadeFrente || !identidadeVerso) {
      setError("É obrigatório enviar a frente e o verso do documento de identificação (RG/CNH)")
      setProfLoading(false)
      return
    }

    if (profForm.tipo === "empresa" && !documentoEmpresa) {
      setError("O documento da empresa (Contrato Social/Cartão CNPJ) é obrigatório")
      setProfLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("cliente_id", cliente?.id || "")
      formDataToSend.append("tipo", profForm.tipo)
      formDataToSend.append("cpf_cnpj", profForm.cpf_cnpj)
      formDataToSend.append("razao_social", profForm.razao_social || "")
      formDataToSend.append("telefone", profForm.telefone)
      formDataToSend.append("senha", profForm.senha)

      // Documento de identidade - frente e verso
      formDataToSend.append("identidadeFrente", identidadeFrente)
      formDataToSend.append("identidadeVerso", identidadeVerso)

      // Documento da empresa
      if (documentoEmpresa) {
        formDataToSend.append("documentoEmpresa", documentoEmpresa)
      }

      // Diplomas - incluir pendente se houver
      const diplomasParaEnviar = [...diplomas]
      if (diplomaEmAndamento.frente) {
        diplomasParaEnviar.push({
          frente: diplomaEmAndamento.frente,
          verso: diplomaEmAndamento.verso
        })
      }

      diplomasParaEnviar.forEach((diploma, index) => {
        formDataToSend.append(`diploma_${index}_frente`, diploma.frente)
        if (diploma.verso) {
          formDataToSend.append(`diploma_${index}_verso`, diploma.verso)
        }
      })
      formDataToSend.append("diplomasCount", diplomasParaEnviar.length.toString())

      const response = await fetch("/api/cliente/tornar-profissional", {
        method: "POST",
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao criar conta de profissional")
        setProfLoading(false)
        return
      }

      setProfSuccess(true)
      setProfLoading(false)
      // Limpar estados
      setIdentidadeFrente(null)
      setIdentidadeVerso(null)
      setDocumentoEmpresa(null)
      setDiplomas([])
      setDiplomaEmAndamento({ frente: null, verso: null })

    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setProfLoading(false)
    }
  }

  if (!cliente) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e senha</p>
      </div>

      {error && !showProfModal && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          {success}
        </div>
      )}

      <div className="max-w-2xl">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize seus dados cadastrais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={handleChange}
                  disabled={!editMode}
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
                          nome: cliente.nome,
                          email: cliente.email,
                          telefone: cliente.telefone,
                          cidade: cliente.cidade || "",
                          estado: cliente.estado || "",
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

        {/* Card Tornar-se Profissional */}
        {!cliente.profissional_id && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Também sou profissional
              </CardTitle>
              <CardDescription>
                Ofereça seus serviços na plataforma e receba solicitações de clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Ao ativar o modo profissional, você poderá oferecer seus serviços de educação
                (aulas de música, reforço escolar, idiomas) e receber solicitações de clientes.
              </p>
              <Button onClick={() => setShowProfModal(true)}>
                Quero oferecer meus serviços
              </Button>
            </CardContent>
          </Card>
        )}

        {cliente.profissional_id && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                Você também é profissional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 mb-4">
                Você possui uma conta de profissional vinculada. Faça login como profissional para gerenciar seus serviços.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('usuario')
                  localStorage.removeItem('tipoUsuario')
                  router.push('/login')
                }}
              >
                Acessar como Profissional
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal para Tornar-se Profissional */}
      <Dialog open={showProfModal} onOpenChange={setShowProfModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {!profSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Criar conta de Profissional</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para oferecer seus serviços na plataforma
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Tipo */}
                <div className="space-y-2">
                  <Label>Tipo de cadastro</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={profForm.tipo === "autonomo" ? "default" : "outline"}
                      onClick={() => setProfForm({ ...profForm, tipo: "autonomo", cpf_cnpj: "" })}
                      className="w-full"
                      size="sm"
                    >
                      Autônomo
                    </Button>
                    <Button
                      type="button"
                      variant={profForm.tipo === "empresa" ? "default" : "outline"}
                      onClick={() => setProfForm({ ...profForm, tipo: "empresa", cpf_cnpj: "" })}
                      className="w-full"
                      size="sm"
                    >
                      Empresa
                    </Button>
                  </div>
                </div>

                {/* CPF/CNPJ */}
                <div className="space-y-2">
                  <Label>{profForm.tipo === "autonomo" ? "CPF" : "CNPJ"} <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder={profForm.tipo === "autonomo" ? "000.000.000-00" : "00.000.000/0000-00"}
                    value={profForm.cpf_cnpj}
                    onChange={(e) => handleProfFormChange('cpf_cnpj', e.target.value)}
                  />
                </div>

                {/* Razão Social (só empresa) */}
                {profForm.tipo === "empresa" && (
                  <div className="space-y-2">
                    <Label>Razão Social <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Nome da empresa"
                      value={profForm.razao_social}
                      onChange={(e) => setProfForm({ ...profForm, razao_social: e.target.value })}
                    />
                  </div>
                )}

                {/* Telefone */}
                <div className="space-y-2">
                  <Label>Telefone/WhatsApp <span className="text-red-500">*</span></Label>
                  <Input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={profForm.telefone}
                    onChange={(e) => handleProfFormChange('telefone', e.target.value)}
                  />
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <Label>Senha <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-gray-500">Mínimo 6 caracteres, 1 maiúscula e 1 especial (!@#$%...)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={profForm.senha}
                        onChange={(e) => setProfForm({ ...profForm, senha: e.target.value })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmar senha"
                        value={profForm.confirmarSenha}
                        onChange={(e) => setProfForm({ ...profForm, confirmarSenha: e.target.value })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Documento de Identidade - Frente e Verso */}
                <div className="space-y-2">
                  <Label>Documento de Identificação (RG/CNH) <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-gray-500">Envie frente e verso do documento</p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Frente */}
                    <div>
                      {comprimindoIdentFrente ? (
                        <div className="flex items-center justify-center h-20 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                          <span className="text-xs text-gray-500">Otimizando...</span>
                        </div>
                      ) : !identidadeFrente ? (
                        <label
                          htmlFor="ident-frente-perfil"
                          className="flex flex-col items-center justify-center h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <Upload className="w-5 h-5 mb-1 text-gray-400" />
                          <p className="text-xs text-gray-500">Frente</p>
                          <input
                            id="ident-frente-perfil"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleIdentidadeFrenteChange}
                          />
                        </label>
                      ) : (
                        <div className="flex items-center justify-between p-2 border border-green-300 rounded-lg bg-green-50 h-20">
                          <div className="flex items-center gap-1 min-w-0">
                            <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <p className="text-xs text-gray-900 truncate">Frente</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIdentidadeFrente(null)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Verso */}
                    <div>
                      {comprimindoIdentVerso ? (
                        <div className="flex items-center justify-center h-20 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                          <span className="text-xs text-gray-500">Otimizando...</span>
                        </div>
                      ) : !identidadeVerso ? (
                        <label
                          htmlFor="ident-verso-perfil"
                          className="flex flex-col items-center justify-center h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <Upload className="w-5 h-5 mb-1 text-gray-400" />
                          <p className="text-xs text-gray-500">Verso</p>
                          <input
                            id="ident-verso-perfil"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleIdentidadeVersoChange}
                          />
                        </label>
                      ) : (
                        <div className="flex items-center justify-between p-2 border border-green-300 rounded-lg bg-green-50 h-20">
                          <div className="flex items-center gap-1 min-w-0">
                            <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <p className="text-xs text-gray-900 truncate">Verso</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIdentidadeVerso(null)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documento da Empresa (só para empresas) */}
                {profForm.tipo === "empresa" && (
                  <div className="space-y-2">
                    <Label>Documento da Empresa <span className="text-red-500">*</span></Label>
                    <p className="text-xs text-gray-500">Contrato Social ou Cartão CNPJ</p>
                    {comprimindoEmpresa ? (
                      <div className="flex items-center justify-center h-20 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                        <span className="text-xs text-gray-500">Otimizando...</span>
                      </div>
                    ) : !documentoEmpresa ? (
                      <label
                        htmlFor="doc-empresa-perfil"
                        className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <Upload className="w-5 h-5 mb-1 text-gray-400" />
                        <p className="text-xs text-gray-500">Clique para enviar</p>
                        <input
                          id="doc-empresa-perfil"
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleEmpresaChange}
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-green-300 rounded-lg bg-green-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <p className="text-sm text-gray-900 truncate">{documentoEmpresa.name}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDocumentoEmpresa(null)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Diplomas/Certificados */}
                <div className="space-y-2">
                  <Label>Diplomas e Certificados <span className="text-gray-400 text-xs font-normal">(opcional)</span></Label>
                  <p className="text-xs text-gray-500">Adicione frente e opcionalmente verso de cada diploma</p>

                  {/* Adicionar novo diploma */}
                  <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Frente do diploma */}
                      <div>
                        {comprimindoDiplomaFrente ? (
                          <div className="flex items-center justify-center h-16 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">Otimizando...</span>
                          </div>
                        ) : !diplomaEmAndamento.frente ? (
                          <label
                            htmlFor="diploma-frente-perfil"
                            className="flex flex-col items-center justify-center h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <GraduationCap className="w-4 h-4 mb-1 text-gray-400" />
                            <p className="text-xs text-gray-500">Frente</p>
                            <input
                              id="diploma-frente-perfil"
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleDiplomaFrenteChange}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between p-2 border border-blue-300 rounded-lg bg-blue-50 h-16">
                            <p className="text-xs text-gray-900 truncate flex-1">{diplomaEmAndamento.frente.name}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDiplomaEmAndamento({ ...diplomaEmAndamento, frente: null })}
                              className="h-5 w-5 p-0 text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Verso do diploma */}
                      <div>
                        {comprimindoDiplomaVerso ? (
                          <div className="flex items-center justify-center h-16 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">Otimizando...</span>
                          </div>
                        ) : !diplomaEmAndamento.verso ? (
                          <label
                            htmlFor="diploma-verso-perfil"
                            className="flex flex-col items-center justify-center h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <GraduationCap className="w-4 h-4 mb-1 text-gray-400" />
                            <p className="text-xs text-gray-500">Verso (opcional)</p>
                            <input
                              id="diploma-verso-perfil"
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleDiplomaVersoChange}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between p-2 border border-blue-300 rounded-lg bg-blue-50 h-16">
                            <p className="text-xs text-gray-900 truncate flex-1">{diplomaEmAndamento.verso.name}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDiplomaEmAndamento({ ...diplomaEmAndamento, verso: null })}
                              className="h-5 w-5 p-0 text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {diplomaEmAndamento.frente && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={adicionarDiploma}
                        className="w-full"
                      >
                        Adicionar este diploma
                      </Button>
                    )}
                  </div>

                  {/* Lista de diplomas adicionados */}
                  {diplomas.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-medium">Diplomas adicionados:</p>
                      {diplomas.map((diploma, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-900">Diploma {index + 1}</p>
                              <p className="text-xs text-gray-500">Frente{diploma.verso ? ' + Verso' : ''}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removerDiploma(index)}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowProfModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleTornarProfissional} disabled={profLoading}>
                  {profLoading ? "Criando..." : "Criar conta"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="text-green-600" />
                </div>
                <DialogTitle className="text-center">Conta criada com sucesso!</DialogTitle>
                <DialogDescription className="text-center">
                  Sua conta de profissional foi criada e está aguardando aprovação do administrador.
                  Você receberá uma notificação quando for aprovado.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => {
                  setShowProfModal(false)
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
