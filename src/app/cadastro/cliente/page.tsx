"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LocationSelects } from "@/components/LocationSelects"
import { Mail, ArrowLeft, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react"

type Etapa = "email" | "verificacao" | "dados"

function CadastroClienteContent() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  const [etapa, setEtapa] = useState<Etapa>("email")
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    senha: "",
    confirmarSenha: "",
  })
  const [codigoVerificacao, setCodigoVerificacao] = useState("")
  const [aceiteTermos, setAceiteTermos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [tempoReenvio, setTempoReenvio] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Enviar código de verificação
  const enviarCodigo = async () => {
    if (!formData.email) {
      setError("Digite seu email")
      return
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido")
      return
    }

    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          tipo: "cadastro"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao enviar código")
        setLoading(false)
        return
      }

      // Iniciar contador de reenvio (60 segundos)
      setTempoReenvio(60)
      const interval = setInterval(() => {
        setTempoReenvio(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setEtapa("verificacao")
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  // Verificar código
  const verificarCodigo = async () => {
    if (!codigoVerificacao || codigoVerificacao.length !== 6) {
      setError("Digite o código de 6 dígitos")
      return
    }

    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          codigo: codigoVerificacao,
          tipo: "cadastro"
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Código inválido")
        setLoading(false)
        return
      }

      setEtapa("dados")
    } catch (err) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  // Finalizar cadastro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validar termos
    if (!aceiteTermos) {
      setError("Você precisa aceitar os termos de uso")
      setLoading(false)
      return
    }

    // Validar senhas
    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (formData.senha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      setLoading(false)
      return
    }

    // Validar senha forte (maiúscula + caractere especial)
    const temMaiuscula = /[A-Z]/.test(formData.senha)
    const temEspecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~';]/.test(formData.senha)
    if (!temMaiuscula || !temEspecial) {
      setError("A senha deve conter pelo menos uma letra maiúscula e um caractere especial (!@#$%...)")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/cadastro/cliente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          cidade: formData.cidade,
          estado: formData.estado,
          senha: formData.senha,
          email_verificado: true, // Email já foi verificado
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Erro ao cadastrar")
        setLoading(false)
        return
      }

      setSuccess(true)
      // Redirecionar após 2 segundos
      setTimeout(() => {
        // Se tem redirect URL, vai para login com o redirect
        // Caso contrário, vai para login normal
        if (redirectUrl) {
          window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`
        } else {
          window.location.href = "/login"
        }
      }, 2000)

    } catch (err) {
      setError("Erro ao conectar com o servidor")
      setLoading(false)
    }
  }

  // Formatar telefone: (00) 00000-0000
  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 11)
    if (numeros.length <= 2) return numeros
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value

    // Aplicar formatação automática no telefone
    if (e.target.name === 'telefone') {
      valor = formatarTelefone(valor)
    }

    setFormData({
      ...formData,
      [e.target.name]: valor,
    })
  }

  // Renderizar etapa de email
  const renderEtapaEmail = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Cadastro de Cliente
        </CardTitle>
        <CardDescription className="text-center">
          Primeiro, vamos verificar seu email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail <span className="text-red-500">*</span></Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {error && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        <Button
          type="button"
          className="w-full"
          onClick={enviarCodigo}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Enviar código de verificação
            </>
          )}
        </Button>
        <div className="text-sm text-center text-gray-600">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-primary-600 hover:underline">
            Fazer login
          </Link>
        </div>
        <div className="text-sm text-center text-gray-600">
          É profissional?{" "}
          <Link href="/cadastro/profissional" className="text-primary-600 hover:underline">
            Cadastre-se aqui
          </Link>
        </div>
      </CardFooter>
    </Card>
  )

  // Renderizar etapa de verificação
  const renderEtapaVerificacao = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Verificar Email
        </CardTitle>
        <CardDescription className="text-center">
          Enviamos um código de 6 dígitos para <strong>{formData.email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código de verificação</Label>
          <Input
            id="codigo"
            type="text"
            placeholder="000000"
            value={codigoVerificacao}
            onChange={(e) => setCodigoVerificacao(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-2xl tracking-widest"
            maxLength={6}
          />
        </div>
        <p className="text-xs text-gray-500 text-center">
          O código expira em 15 minutos
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {error && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        <Button
          type="button"
          className="w-full"
          onClick={verificarCodigo}
          disabled={loading || codigoVerificacao.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Verificar código
            </>
          )}
        </Button>
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setEtapa("email")
              setCodigoVerificacao("")
              setError("")
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={enviarCodigo}
            disabled={tempoReenvio > 0 || loading}
          >
            {tempoReenvio > 0 ? `Reenviar em ${tempoReenvio}s` : "Reenviar código"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  // Renderizar etapa de dados
  const renderEtapaDados = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-2">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          Email Verificado!
        </CardTitle>
        <CardDescription className="text-center">
          Complete seu cadastro para começar
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {formData.email}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo <span className="text-red-500">*</span></Label>
            <Input
              id="nome"
              name="nome"
              type="text"
              placeholder="Seu nome completo"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone/WhatsApp <span className="text-gray-400 text-xs font-normal">(opcional)</span></Label>
            <Input
              id="telefone"
              name="telefone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChange={handleChange}
            />
          </div>

          <LocationSelects
            estado={formData.estado}
            cidade={formData.cidade}
            onEstadoChange={(sigla) => setFormData(prev => ({ ...prev, estado: sigla }))}
            onCidadeChange={(nome) => setFormData(prev => ({ ...prev, cidade: nome }))}
          />

          <div className="space-y-2">
            <Label htmlFor="senha">Senha <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="senha"
                name="senha"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={formData.senha}
                onChange={handleChange}
                required
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
            <Label htmlFor="confirmarSenha">Confirmar senha <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme sua senha"
                value={formData.confirmarSenha}
                onChange={handleChange}
                required
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

          {/* Termos de Uso */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="aceiteTermos"
              checked={aceiteTermos}
              onChange={(e) => setAceiteTermos(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="aceiteTermos" className="text-sm text-gray-600">
              Li e concordo com os{" "}
              <Link href="/termos" className="text-primary-600 hover:underline" target="_blank">
                Termos de Uso
              </Link>
              . A Parmot atua como intermediária e não se responsabiliza por eventuais problemas entre as partes.
              <span className="text-red-500"> *</span>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {error && (
            <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
              Cadastro realizado com sucesso! Redirecionando...
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || success}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cadastrando...
              </>
            ) : "Criar conta"}
          </Button>
          <div className="text-sm text-center text-gray-600">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary-600 hover:underline">
              Fazer login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      {etapa === "email" && renderEtapaEmail()}
      {etapa === "verificacao" && renderEtapaVerificacao()}
      {etapa === "dados" && renderEtapaDados()}
    </div>
  )
}

export default function CadastroCliente() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <CadastroClienteContent />
    </Suspense>
  )
}
