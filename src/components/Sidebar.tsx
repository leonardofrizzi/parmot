"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, FileText, User, LogOut, ChevronRight, ChevronLeft, Plus, Moon, Search, Coins, ClipboardCheck, DollarSign, ArrowLeftRight, Briefcase, Users, Clock, Upload, X, GraduationCap, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { compressImage } from "@/lib/compressImage"

interface SidebarProps {
  tipo: "cliente" | "profissional"
}

export default function Sidebar({ tipo }: SidebarProps) {
  const [expanded, setExpanded] = useState(false)
  const [saldoMoedas, setSaldoMoedas] = useState<number | null>(null)
  const [outroPerfilId, setOutroPerfilId] = useState<string | null>(null)
  const [outroPerfilAprovado, setOutroPerfilAprovado] = useState<boolean>(true)
  const [switching, setSwitching] = useState(false)
  const [usuario, setUsuario] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalSuccess, setModalSuccess] = useState(false)
  const [modalError, setModalError] = useState("")

  // Form states para virar profissional (quando é cliente)
  const [profForm, setProfForm] = useState({
    tipo: "autonomo" as "autonomo" | "empresa",
    cpf_cnpj: "",
    razao_social: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  })
  const [identidadeFrente, setIdentidadeFrente] = useState<File | null>(null)
  const [identidadeVerso, setIdentidadeVerso] = useState<File | null>(null)
  const [documentoEmpresa, setDocumentoEmpresa] = useState<File | null>(null)
  const [diplomas, setDiplomas] = useState<{ frente: File; verso: File | null }[]>([])
  const [diplomaEmAndamento, setDiplomaEmAndamento] = useState<{ frente: File | null; verso: File | null }>({ frente: null, verso: null })

  // Form states para virar cliente (quando é profissional)
  const [clienteForm, setClienteForm] = useState({
    senha: "",
    confirmarSenha: "",
  })

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Buscar dados atualizados do usuário e verificar se tem outro perfil
  useEffect(() => {
    const fetchUsuarioAtualizado = async () => {
      const usuarioData = localStorage.getItem('usuario')
      if (!usuarioData) return

      const user = JSON.parse(usuarioData)
      setUsuario(user)

      // Buscar dados atualizados do banco para garantir que temos profissional_id/cliente_id correto
      try {
        const endpoint = tipo === "profissional"
          ? `/api/profissional/${user.id}`
          : `/api/cliente/dados/${user.id}`

        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          const usuarioAtualizado = data.profissional || data.cliente

          if (usuarioAtualizado) {
            // Atualizar localStorage com dados mais recentes
            localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado))
            setUsuario(usuarioAtualizado)

            if (tipo === "profissional") {
              fetchSaldo(user.id)
              if (usuarioAtualizado.cliente_id) {
                setOutroPerfilId(usuarioAtualizado.cliente_id)
                setOutroPerfilAprovado(true) // Cliente não precisa aprovação
              }
            } else {
              if (usuarioAtualizado.profissional_id) {
                setOutroPerfilId(usuarioAtualizado.profissional_id)
                // Buscar status de aprovação do profissional
                const profResponse = await fetch(`/api/profissional/${usuarioAtualizado.profissional_id}`)
                if (profResponse.ok) {
                  const profData = await profResponse.json()
                  setOutroPerfilAprovado(profData.profissional?.aprovado || false)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados atualizados:", error)
        // Fallback para dados do localStorage
        if (tipo === "profissional") {
          fetchSaldo(user.id)
          if (user.cliente_id) {
            setOutroPerfilId(user.cliente_id)
          }
        } else {
          if (user.profissional_id) {
            setOutroPerfilId(user.profissional_id)
          }
        }
      }
    }

    fetchUsuarioAtualizado()
  }, [tipo])

  const fetchSaldo = async (profissionalId: string) => {
    try {
      const response = await fetch(`/api/profissional/saldo?profissional_id=${profissionalId}`)
      if (response.ok) {
        const data = await response.json()
        setSaldoMoedas(data.saldo)
      }
    } catch (error) {
      console.error("Erro ao buscar saldo:", error)
    }
  }

  const menuItemsCliente = [
    { icon: Home, label: "Início", href: "/dashboard/cliente" },
    { icon: Plus, label: "Solicitar Serviço", href: "/dashboard/cliente/solicitar" },
    { icon: FileText, label: "Minhas Solicitações", href: "/dashboard/cliente/solicitacoes" },
    { icon: User, label: "Meu Perfil", href: "/dashboard/cliente/perfil" },
  ]

  const menuItemsProfissional = [
    { icon: Home, label: "Início", href: "/dashboard/profissional" },
    { icon: Search, label: "Buscar Serviços", href: "/dashboard/profissional/solicitacoes" },
    { icon: ClipboardCheck, label: "Meus Atendimentos", href: "/dashboard/profissional/atendimentos" },
    { icon: Coins, label: "Comprar Moedas", href: "/dashboard/profissional/moedas" },
    { icon: DollarSign, label: "Reembolsos", href: "/dashboard/profissional/reembolsos" },
    { icon: User, label: "Meu Perfil", href: "/dashboard/profissional/perfil" },
  ]

  const menuItems = tipo === "cliente" ? menuItemsCliente : menuItemsProfissional

  const handleLogout = () => {
    localStorage.removeItem('usuario')
    localStorage.removeItem('tipoUsuario')
    router.push('/login')
  }

  // Função para clicar no toggle
  const handleToggleClick = () => {
    if (outroPerfilId) {
      // Já tem outro perfil
      if (tipo === "cliente" && !outroPerfilAprovado) {
        // Profissional ainda não aprovado, não permitir switch
        return
      }
      // Fazer switch direto
      handleSwitchMode()
    } else {
      // Não tem outro perfil, abrir modal para criar
      setShowModal(true)
      setModalError("")
      setModalSuccess(false)
    }
  }

  // Função para alternar entre modos cliente/profissional (quando já tem ambos)
  const handleSwitchMode = async () => {
    if (!outroPerfilId || switching) return

    setSwitching(true)

    try {
      const novoTipo = tipo === "cliente" ? "profissional" : "cliente"
      const response = await fetch(`/api/${novoTipo === "profissional" ? "profissional" : "cliente/dados"}/${outroPerfilId}`)

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('usuario', JSON.stringify(data.usuario || data.profissional || data.cliente))
        localStorage.setItem('tipoUsuario', novoTipo)
        router.push(`/dashboard/${novoTipo}`)
      } else {
        console.error("Erro ao buscar dados do outro perfil")
      }
    } catch (error) {
      console.error("Erro ao trocar de modo:", error)
    } finally {
      setSwitching(false)
    }
  }

  // Validação de arquivo
  const validarArquivo = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      setModalError("O arquivo deve ter no máximo 5MB")
      return false
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      setModalError("Apenas arquivos PDF, JPG ou PNG são permitidos")
      return false
    }
    return true
  }

  // Handler para upload de identidade frente (com compressão)
  const handleIdentidadeFrenteChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validarArquivo(file)) {
      try {
        const compressed = await compressImage(file)
        setIdentidadeFrente(compressed)
      } catch {
        setIdentidadeFrente(file)
      }
      setModalError("")
    }
  }

  // Handler para upload de identidade verso (com compressão)
  const handleIdentidadeVersoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validarArquivo(file)) {
      try {
        const compressed = await compressImage(file)
        setIdentidadeVerso(compressed)
      } catch {
        setIdentidadeVerso(file)
      }
      setModalError("")
    }
  }

  // Handler para upload de documento da empresa (com compressão)
  const handleEmpresaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validarArquivo(file)) {
      try {
        const compressed = await compressImage(file)
        setDocumentoEmpresa(compressed)
      } catch {
        setDocumentoEmpresa(file)
      }
      setModalError("")
    }
  }

  // Handler para upload de diploma frente (com compressão)
  const handleDiplomaFrenteChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validarArquivo(file)) {
      try {
        const compressed = await compressImage(file)
        setDiplomaEmAndamento({ ...diplomaEmAndamento, frente: compressed })
      } catch {
        setDiplomaEmAndamento({ ...diplomaEmAndamento, frente: file })
      }
      setModalError("")
    }
  }

  // Handler para upload de diploma verso (com compressão)
  const handleDiplomaVersoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validarArquivo(file)) {
      try {
        const compressed = await compressImage(file)
        setDiplomaEmAndamento({ ...diplomaEmAndamento, verso: compressed })
      } catch {
        setDiplomaEmAndamento({ ...diplomaEmAndamento, verso: file })
      }
      setModalError("")
    }
  }

  // Adicionar diploma à lista
  const adicionarDiploma = () => {
    if (diplomaEmAndamento.frente) {
      setDiplomas([...diplomas, { frente: diplomaEmAndamento.frente, verso: diplomaEmAndamento.verso }])
      setDiplomaEmAndamento({ frente: null, verso: null })
    }
  }

  const removerDiploma = (index: number) => {
    setDiplomas(diplomas.filter((_, i) => i !== index))
  }

  // Criar conta de profissional (quando é cliente)
  const handleCriarProfissional = async () => {
    setModalError("")
    setModalLoading(true)

    if (profForm.senha !== profForm.confirmarSenha) {
      setModalError("As senhas não coincidem")
      setModalLoading(false)
      return
    }

    if (profForm.senha.length < 6) {
      setModalError("A senha deve ter no mínimo 6 caracteres")
      setModalLoading(false)
      return
    }

    // Validar senha forte (maiúscula + caractere especial)
    const temMaiuscula = /[A-Z]/.test(profForm.senha)
    const temEspecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/.test(profForm.senha)
    if (!temMaiuscula || !temEspecial) {
      setModalError("A senha deve conter pelo menos uma letra maiúscula e um caractere especial (!@#$%...)")
      setModalLoading(false)
      return
    }

    if (!profForm.cpf_cnpj) {
      setModalError(profForm.tipo === "autonomo" ? "CPF é obrigatório" : "CNPJ é obrigatório")
      setModalLoading(false)
      return
    }

    if (!profForm.telefone) {
      setModalError("Telefone é obrigatório para profissionais")
      setModalLoading(false)
      return
    }

    if (!identidadeFrente || !identidadeVerso) {
      setModalError("É obrigatório enviar a frente e o verso do documento de identificação (RG/CNH)")
      setModalLoading(false)
      return
    }

    if (profForm.tipo === "empresa" && !documentoEmpresa) {
      setModalError("O documento da empresa (Contrato Social/Cartão CNPJ) é obrigatório")
      setModalLoading(false)
      return
    }

    try {
      // Usar FormData para enviar documentos
      const formData = new FormData()
      formData.append("cliente_id", usuario?.id)
      formData.append("tipo", profForm.tipo)
      formData.append("cpf_cnpj", profForm.cpf_cnpj)
      formData.append("razao_social", profForm.razao_social || "")
      formData.append("telefone", profForm.telefone)
      formData.append("senha", profForm.senha)

      // Documento de identidade - frente e verso (obrigatório)
      formData.append("identidadeFrente", identidadeFrente)
      formData.append("identidadeVerso", identidadeVerso)

      // Documento da empresa (obrigatório para empresas)
      if (documentoEmpresa) {
        formData.append("documentoEmpresa", documentoEmpresa)
      }

      // Diplomas/certificados com frente e verso (opcional, múltiplos)
      // Incluir diploma pendente (selecionado mas não adicionado à lista)
      const diplomasParaEnviar = [...diplomas]
      if (diplomaEmAndamento.frente) {
        diplomasParaEnviar.push({
          frente: diplomaEmAndamento.frente,
          verso: diplomaEmAndamento.verso
        })
      }

      diplomasParaEnviar.forEach((diploma, index) => {
        formData.append(`diploma_${index}_frente`, diploma.frente)
        if (diploma.verso) {
          formData.append(`diploma_${index}_verso`, diploma.verso)
        }
      })
      formData.append("diplomasCount", diplomasParaEnviar.length.toString())

      console.log("Enviando dados para API...")
      const response = await fetch("/api/cliente/tornar-profissional", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)

      let data
      try {
        data = await response.json()
        console.log("Response data:", data)
      } catch (jsonErr) {
        console.error("Erro ao parsear JSON:", jsonErr)
        setModalError("Erro ao processar resposta do servidor")
        setModalLoading(false)
        return
      }

      if (!response.ok) {
        console.error("Erro da API:", data.error)
        setModalError(data.error || "Erro ao criar conta de profissional")
        setModalLoading(false)
        return
      }

      setModalSuccess(true)
      setModalLoading(false)
      setIdentidadeFrente(null)
      setIdentidadeVerso(null)
      setDocumentoEmpresa(null)
      setDiplomas([])
    } catch (err) {
      console.error("Erro no catch:", err)
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setModalError(`Erro ao conectar com o servidor: ${errorMessage}`)
      setModalLoading(false)
    }
  }

  // Criar conta de cliente (quando é profissional)
  const handleCriarCliente = async () => {
    setModalError("")
    setModalLoading(true)

    if (clienteForm.senha !== clienteForm.confirmarSenha) {
      setModalError("As senhas não coincidem")
      setModalLoading(false)
      return
    }

    if (clienteForm.senha.length < 6) {
      setModalError("A senha deve ter no mínimo 6 caracteres")
      setModalLoading(false)
      return
    }

    try {
      const response = await fetch("/api/profissional/tornar-cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profissional_id: usuario?.id,
          senha: clienteForm.senha,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setModalError(data.error || "Erro ao criar conta de cliente")
        setModalLoading(false)
        return
      }

      setModalSuccess(true)
      setModalLoading(false)
    } catch (err) {
      setModalError("Erro ao conectar com o servidor")
      setModalLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    if (modalSuccess) {
      window.location.reload()
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative",
          expanded ? "w-64" : "w-20"
        )}
      >
        {/* Botão de expandir/retrair */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors z-10 shadow-sm"
        >
          {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Logo / Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          {expanded ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Parmot</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
              <GraduationCap size={20} className="text-white" />
            </div>
          )}
        </div>

        {/* Toggle Modo Cliente/Profissional - SEMPRE APARECE */}
        <div className={cn("mx-3 mt-4", !expanded && "mx-2")}>
          {expanded ? (
            <button
              onClick={handleToggleClick}
              disabled={switching}
              className={cn(
                "w-full p-3 rounded-lg border-2 transition-all",
                tipo === "cliente"
                  ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                  : "bg-purple-50 border-purple-200 hover:bg-purple-100",
                switching && "opacity-50 cursor-wait"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tipo === "cliente" ? (
                    <Users className="text-blue-600" size={18} />
                  ) : (
                    <Briefcase className="text-purple-600" size={18} />
                  )}
                  <span className={cn(
                    "text-sm font-medium",
                    tipo === "cliente" ? "text-blue-700" : "text-purple-700"
                  )}>
                    {tipo === "cliente" ? "Modo Cliente" : "Modo Profissional"}
                  </span>
                </div>
                <ArrowLeftRight size={16} className={cn(
                  tipo === "cliente" ? "text-blue-500" : "text-purple-500",
                  switching && "animate-spin"
                )} />
              </div>
              <p className={cn(
                "text-xs mt-1 text-left",
                tipo === "cliente"
                  ? (outroPerfilId && !outroPerfilAprovado ? "text-orange-600" : "text-blue-600")
                  : "text-purple-600"
              )}>
                {outroPerfilId
                  ? (tipo === "cliente" && !outroPerfilAprovado
                      ? "⏳ Aguardando aprovação do admin"
                      : `Alternar para ${tipo === "cliente" ? "profissional" : "cliente"}`)
                  : `Quero ${tipo === "cliente" ? "oferecer serviços" : "solicitar serviços"}`
                }
              </p>
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleClick}
                  disabled={switching}
                  className={cn(
                    "w-full p-2 rounded-lg border-2 flex flex-col items-center transition-all",
                    tipo === "cliente"
                      ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                      : "bg-purple-50 border-purple-200 hover:bg-purple-100",
                    switching && "opacity-50 cursor-wait"
                  )}
                >
                  {tipo === "cliente" ? (
                    <Users className="text-blue-600" size={18} />
                  ) : (
                    <Briefcase className="text-purple-600" size={18} />
                  )}
                  <ArrowLeftRight size={12} className={cn(
                    "mt-1",
                    tipo === "cliente" ? "text-blue-500" : "text-purple-500",
                    switching && "animate-spin"
                  )} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>
                  {outroPerfilId
                    ? (tipo === "cliente" && !outroPerfilAprovado
                        ? "Aguardando aprovação do admin"
                        : `Alternar para ${tipo === "cliente" ? "profissional" : "cliente"}`)
                    : `Tornar-se ${tipo === "cliente" ? "profissional" : "cliente"}`
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Saldo de Moedas - Apenas para profissionais */}
        {tipo === "profissional" && saldoMoedas !== null && (
          <Link href="/dashboard/profissional/moedas">
            <div className={cn(
              "mx-3 mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg cursor-pointer hover:from-yellow-100 hover:to-amber-100 transition-colors",
              !expanded && "p-2"
            )}>
              {expanded ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="text-yellow-600" size={20} />
                    <span className="text-sm font-medium text-gray-700">Seu saldo</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-700">{saldoMoedas}</span>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      <Coins className="text-yellow-600" size={18} />
                      <span className="text-xs font-bold text-yellow-700 mt-1">{saldoMoedas}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Saldo: {saldoMoedas} moedas</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </Link>
        )}

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            if (expanded) {
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-11",
                      !isActive && "hover:bg-gray-100"
                    )}
                  >
                    <Icon size={20} className="mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            }

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "w-full h-11",
                        !isActive && "hover:bg-gray-100"
                      )}
                    >
                      <Icon size={20} />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Dark Mode & Logout */}
        <div className="px-3 py-4 border-t border-gray-200 space-y-1">
          {expanded ? (
            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-gray-100"
            >
              <Moon size={20} className="mr-3" />
              Modo Escuro
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-11 hover:bg-gray-100"
                >
                  <Moon size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Modo Escuro</p>
              </TooltipContent>
            </Tooltip>
          )}

          {expanded ? (
            <Button
              variant="ghost"
              className="w-full justify-start h-11 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut size={20} className="mr-3" />
              Sair
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-11 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sair</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* Modal para criar outro perfil */}
      <Dialog open={showModal} onOpenChange={handleModalClose}>
        <DialogContent className={cn(
          "max-h-[90vh] overflow-y-auto",
          tipo === "cliente" && !modalSuccess ? "sm:max-w-[500px]" : "sm:max-w-[400px]"
        )}>
          {!modalSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {tipo === "cliente" ? "Criar conta de Profissional" : "Tornar-se Cliente"}
                </DialogTitle>
                <DialogDescription>
                  {tipo === "cliente"
                    ? "Preencha os dados abaixo para oferecer seus serviços na plataforma"
                    : "Defina uma senha para acessar como cliente"
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                {tipo === "cliente" ? (
                  // Formulário para cliente virar profissional
                  <div className="space-y-4">
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

                    <div className="space-y-2">
                      <Label>{profForm.tipo === "autonomo" ? "CPF" : "CNPJ"} <span className="text-red-500">*</span></Label>
                      <Input
                        placeholder={profForm.tipo === "autonomo" ? "000.000.000-00" : "00.000.000/0000-00"}
                        value={profForm.cpf_cnpj}
                        onChange={(e) => setProfForm({ ...profForm, cpf_cnpj: e.target.value })}
                      />
                    </div>

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

                    <div className="space-y-2">
                      <Label>Telefone/WhatsApp <span className="text-red-500">*</span></Label>
                      <Input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={profForm.telefone}
                        onChange={(e) => setProfForm({ ...profForm, telefone: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Senha <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
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
                      </div>

                      <div className="space-y-2">
                        <Label>Confirmar senha <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirme sua senha"
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

                    {/* Upload de Documento de Identificação Pessoal - Frente e Verso (Obrigatório) */}
                    <div className="space-y-2">
                      <Label>Documento de Identificação Pessoal <span className="text-red-500">*</span></Label>
                      <p className="text-xs text-gray-500">
                        RG ou CNH {profForm.tipo === "empresa" ? "do responsável" : ""} - envie frente e verso
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Frente */}
                        <div>
                          <p className="text-xs text-gray-600 mb-1 font-medium">Frente</p>
                          {!identidadeFrente ? (
                            <label
                              htmlFor="identidade-frente-modal"
                              className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <Upload className="w-5 h-5 mb-1 text-gray-400" />
                              <p className="text-xs text-gray-500">Enviar</p>
                              <input
                                id="identidade-frente-modal"
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleIdentidadeFrenteChange}
                              />
                            </label>
                          ) : (
                            <div className="flex items-center justify-between p-2 border border-green-300 rounded-lg bg-green-50">
                              <div className="flex items-center gap-1 min-w-0">
                                <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <p className="text-xs text-gray-900 truncate">{identidadeFrente.name}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIdentidadeFrente(null)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Verso */}
                        <div>
                          <p className="text-xs text-gray-600 mb-1 font-medium">Verso</p>
                          {!identidadeVerso ? (
                            <label
                              htmlFor="identidade-verso-modal"
                              className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <Upload className="w-5 h-5 mb-1 text-gray-400" />
                              <p className="text-xs text-gray-500">Enviar</p>
                              <input
                                id="identidade-verso-modal"
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleIdentidadeVersoChange}
                              />
                            </label>
                          ) : (
                            <div className="flex items-center justify-between p-2 border border-green-300 rounded-lg bg-green-50">
                              <div className="flex items-center gap-1 min-w-0">
                                <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <p className="text-xs text-gray-900 truncate">{identidadeVerso.name}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIdentidadeVerso(null)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Upload de Documento da Empresa (Obrigatório apenas para empresas) */}
                    {profForm.tipo === "empresa" && (
                      <div className="space-y-2">
                        <Label>Documento da Empresa <span className="text-red-500">*</span></Label>
                        <p className="text-xs text-gray-500">Contrato Social ou Cartão CNPJ</p>

                        {!documentoEmpresa ? (
                          <label
                            htmlFor="documento-empresa-modal"
                            className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <Upload className="w-6 h-6 mb-1 text-gray-400" />
                            <p className="text-sm text-gray-500">Clique para enviar</p>
                            <p className="text-xs text-gray-400">PDF, JPG ou PNG</p>
                            <input
                              id="documento-empresa-modal"
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleEmpresaChange}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
                              <p className="text-sm font-medium text-gray-900 truncate">{documentoEmpresa.name}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDocumentoEmpresa(null)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upload de Diplomas/Certificados com Frente e Verso (Opcional) */}
                    <div className="space-y-2">
                      <Label>Diplomas e Certificados <span className="text-gray-400">(opcional)</span></Label>
                      <p className="text-xs text-gray-500">Adicione a frente e opcionalmente o verso de cada diploma</p>

                      {/* Adicionar novo diploma */}
                      <div className="p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Frente do diploma */}
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Frente *</p>
                            {!diplomaEmAndamento.frente ? (
                              <label
                                htmlFor="diploma-frente-modal"
                                className="flex flex-col items-center justify-center w-full h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition-colors"
                              >
                                <Upload className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-500">Enviar</p>
                                <input
                                  id="diploma-frente-modal"
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={handleDiplomaFrenteChange}
                                />
                              </label>
                            ) : (
                              <div className="flex items-center justify-between p-2 border border-blue-300 rounded-lg bg-blue-50">
                                <p className="text-xs text-gray-900 truncate flex-1">{diplomaEmAndamento.frente.name}</p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDiplomaEmAndamento({ ...diplomaEmAndamento, frente: null })}
                                  className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Verso do diploma */}
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Verso (opcional)</p>
                            {!diplomaEmAndamento.verso ? (
                              <label
                                htmlFor="diploma-verso-modal"
                                className="flex flex-col items-center justify-center w-full h-16 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-100 transition-colors"
                              >
                                <Upload className="w-4 h-4 text-gray-400" />
                                <p className="text-xs text-gray-500">Enviar</p>
                                <input
                                  id="diploma-verso-modal"
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={handleDiplomaVersoChange}
                                />
                              </label>
                            ) : (
                              <div className="flex items-center justify-between p-2 border border-blue-300 rounded-lg bg-blue-50">
                                <p className="text-xs text-gray-900 truncate flex-1">{diplomaEmAndamento.verso.name}</p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDiplomaEmAndamento({ ...diplomaEmAndamento, verso: null })}
                                  className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
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
                            <div key={index} className="flex items-center justify-between p-2 border border-green-300 rounded-lg bg-green-50">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-900 truncate">Diploma {index + 1}</p>
                                  <p className="text-xs text-gray-500">Frente{diploma.verso ? ' + Verso' : ''}</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerDiploma(index)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Formulário para profissional virar cliente
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Senha para acesso como cliente <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={clienteForm.senha}
                          onChange={(e) => setClienteForm({ ...clienteForm, senha: e.target.value })}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Confirmar senha <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua senha"
                          value={clienteForm.confirmarSenha}
                          onChange={(e) => setClienteForm({ ...clienteForm, confirmarSenha: e.target.value })}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {modalError && (
                  <div className="p-3 mt-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {modalError}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={tipo === "cliente" ? handleCriarProfissional : handleCriarCliente}
                  disabled={modalLoading}
                >
                  {modalLoading ? "Criando..." : "Criar conta"}
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
                  {tipo === "cliente"
                    ? "Sua conta de profissional foi criada e está aguardando aprovação do administrador."
                    : "Sua conta de cliente foi criada. Agora você pode solicitar serviços na plataforma."
                  }
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={handleModalClose} className="w-full">
                  Entendi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
