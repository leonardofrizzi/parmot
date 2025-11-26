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
import { Briefcase, CheckCircle2, Clock, Upload, FileText, X } from "lucide-react"

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  cidade: string
  estado: string
  profissional_id?: string
}

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
  const [documento, setDocumento] = useState<File | null>(null)
  const [profForm, setProfForm] = useState({
    tipo: "autonomo" as "autonomo" | "empresa",
    cpf_cnpj: "",
    razao_social: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  })

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

      // Atualizar localStorage
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setDocumento(file)
      setError("")
    }
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

    if (!profForm.telefone) {
      setError("Telefone é obrigatório para profissionais")
      setProfLoading(false)
      return
    }

    if (!documento) {
      setError("O documento de identificação é obrigatório")
      setProfLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("cliente_id", cliente?.id || "")
      formData.append("tipo", profForm.tipo)
      formData.append("cpf_cnpj", profForm.cpf_cnpj)
      formData.append("razao_social", profForm.razao_social || "")
      formData.append("telefone", profForm.telefone)
      formData.append("senha", profForm.senha)
      if (documento) {
        formData.append("documento", documento)
      }

      const response = await fetch("/api/cliente/tornar-profissional", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao criar conta de profissional")
        setProfLoading(false)
        return
      }

      setProfSuccess(true)
      setProfLoading(false)
      setDocumento(null)

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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                      onClick={() => setProfForm({ ...profForm, tipo: "autonomo" })}
                      className="w-full"
                      size="sm"
                    >
                      Autônomo
                    </Button>
                    <Button
                      type="button"
                      variant={profForm.tipo === "empresa" ? "default" : "outline"}
                      onClick={() => setProfForm({ ...profForm, tipo: "empresa" })}
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
                    onChange={(e) => setProfForm({ ...profForm, cpf_cnpj: e.target.value })}
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
                    onChange={(e) => setProfForm({ ...profForm, telefone: e.target.value })}
                  />
                </div>

                {/* Senha */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Senha <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={profForm.senha}
                      onChange={(e) => setProfForm({ ...profForm, senha: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confirmar senha <span className="text-red-500">*</span></Label>
                    <Input
                      type="password"
                      placeholder="Confirme sua senha"
                      value={profForm.confirmarSenha}
                      onChange={(e) => setProfForm({ ...profForm, confirmarSenha: e.target.value })}
                    />
                  </div>
                </div>

                {/* Upload de Documento */}
                <div className="space-y-2">
                  <Label>Documento <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-gray-500">
                    {profForm.tipo === "autonomo"
                      ? "RG, CNH ou Certificado MEI"
                      : "Contrato Social ou CNPJ"}
                  </p>

                  {!documento ? (
                    <label
                      htmlFor="documento-perfil"
                      className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Upload className="w-6 h-6 mb-1 text-gray-400" />
                      <p className="text-sm text-gray-500">Clique para enviar</p>
                      <p className="text-xs text-gray-400">PDF, JPG ou PNG (máx. 5MB)</p>
                      <input
                        id="documento-perfil"
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-900 truncate">{documento.name}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDocumento(null)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
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
